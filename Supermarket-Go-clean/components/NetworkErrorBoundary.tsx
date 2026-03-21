import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OfflineBanner } from '@/components/OfflineComponents';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
}

class NetworkErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log network-related errors
    if (error.message.includes('network') || 
        error.message.includes('fetch') || 
        error.message.includes('connection')) {
      console.error('Network error caught by boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a network-related error
      const isNetworkError = this.state.error?.message.includes('network') ||
                           this.state.error?.message.includes('fetch') ||
                           this.state.error?.message.includes('connection');

      if (isNetworkError) {
        const FallbackComponent = this.props.fallback || DefaultNetworkFallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // For non-network errors, show offline banner
      return (
        <View style={styles.container}>
          <OfflineBanner 
            customMessage="Network error occurred. Some features may be unavailable."
            onRetry={this.handleRetry}
          />
          {this.props.children}
        </View>
      );
    }

    return this.props.children;
  }
}

const DefaultNetworkFallback: React.FC<{ error?: Error; retry?: () => void }> = ({ 
  error, 
  retry 
}) => {
  return (
    <View style={styles.fallbackContainer}>
      <OfflineBanner 
        customMessage="Network connection lost. Please check your internet connection."
        onRetry={retry}
      />
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>Network Error</Text>
        <Text style={styles.errorMessage}>
          {error?.message || 'Unable to connect to the server. Please check your internet connection and try again.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
});

export default NetworkErrorBoundary;
