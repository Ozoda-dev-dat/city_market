import React, { Component, ComponentType, PropsWithChildren } from "react";
import { ErrorFallback, ErrorFallbackProps } from "@/components/ErrorFallback";
import { logger } from "@/lib/data-security";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
  maxRetries?: number;
  retryDelay?: number;
}>;

type ErrorBoundaryState = { 
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
};

/**
 * Enhanced Error Boundary with retry logic and monitoring
 * This is a special case for using the class components. Error boundaries must be class components because React only provides error boundary functionality through lifecycle methods (componentDidCatch and getDerivedStateFromError) which are not available in functional components.
 * https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private static maxGlobalRetries = 10;
  private static globalRetryCount = 0;

  state: ErrorBoundaryState = { 
    error: null, 
    retryCount: 0,
    isRetrying: false,
  };

  static defaultProps: {
    FallbackComponent: ComponentType<ErrorFallbackProps>;
    maxRetries: number;
    retryDelay: number;
  } = {
    FallbackComponent: ErrorFallback,
    maxRetries: 3,
    retryDelay: 1000,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    // Enhanced error logging with monitoring
    this.logError(error, info.componentStack);

    // Call custom error handler if provided
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }

    // Update global retry count
    ErrorBoundary.globalRetryCount++;
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private logError = (error: Error, componentStack: string): void => {
    // Log to secure logger
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack,
      retryCount: this.state.retryCount,
      globalRetryCount: ErrorBoundary.globalRetryCount,
    });

    // Log to monitoring service
    this.logToMonitoringService(error, componentStack);
  };

  private logToMonitoringService = (error: Error, componentStack: string): void => {
    // In a real app, this would send to a monitoring service like Sentry, LogRocket, etc.
    const errorData = {
      timestamp: new Date().toISOString(),
      type: 'REACT_ERROR_BOUNDARY',
      message: error.message,
      stack: error.stack,
      componentStack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location?.href : 'Unknown',
      retryCount: this.state.retryCount,
      globalRetryCount: ErrorBoundary.globalRetryCount,
      errorBoundaryId: this.constructor.name,
    };

    // For now, log to console (in production, this would be sent to monitoring service)
    console.error('[MONITORING]', JSON.stringify(errorData));
  };

  private handleRetry = (): void => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    
    if (this.state.retryCount < maxRetries && ErrorBoundary.globalRetryCount < ErrorBoundary.maxGlobalRetries) {
      this.setState({ isRetrying: true });
      
      // Clear existing timeout
      this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
      
      // Set timeout for retry
      const timeout = setTimeout(() => {
        this.setState(prevState => ({
          error: null,
          retryCount: prevState.retryCount + 1,
          isRetrying: false,
        }));
      }, retryDelay);

      this.retryTimeouts.push(timeout);
    }
  };

  private handleReset = (): void => {
    // Reset both local and global retry counts
    this.setState({ 
      error: null, 
      retryCount: 0,
      isRetrying: false,
    });
    ErrorBoundary.globalRetryCount = 0;
  };

  private canRetry = (): boolean => {
    const { maxRetries = 3 } = this.props;
    return (
      this.state.retryCount < maxRetries && 
      ErrorBoundary.globalRetryCount < ErrorBoundary.maxGlobalRetries &&
      !this.state.isRetrying
    );
  };

  resetError = (): void => {
    this.handleReset();
  };

  render() {
    const { FallbackComponent } = this.props;
    const { error, retryCount, isRetrying } = this.state;

    if (error && FallbackComponent) {
      return (
        <FallbackComponent
          error={error}
          resetError={this.resetError}
          retryCount={retryCount}
          canRetry={this.canRetry()}
          isRetrying={isRetrying}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
