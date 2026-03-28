import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineCache } from '@/lib/offline-cache';
import { useTheme } from '@/context/ThemeContext';
import { useNetworkStatus } from '@/lib/network-manager';

interface NetworkContextValue {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string;
  connectionStrength: string;
}

const NetworkContext = React.createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  // Use a simple online/offline detection that works across platforms
  // without relying on @react-native-community/netinfo (version mismatch with Expo Go)
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    // On native, assume online (can enhance later)
    setIsOnline(true);
  }, []);

  const value: NetworkContextValue = {
    isOnline,
    isOffline: !isOnline,
    connectionType: 'unknown',
    connectionStrength: 'unknown',
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = React.useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}

interface OfflineBannerProps {
  onRetry?: () => void;
  showRetryButton?: boolean;
  customMessage?: string;
}

export function OfflineBanner({ 
  onRetry, 
  showRetryButton = true, 
  customMessage 
}: OfflineBannerProps) {
  const networkStatus = useNetworkStatus();
  const { isDarkMode } = useTheme();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  }, [onRetry]);

  if (networkStatus.isConnected === null) {
    return null;
  }

  if (networkStatus.isConnected && networkStatus.isInternetReachable) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDarkMode ? '#ff6b6b' : '#ff5252',
        borderColor: isDarkMode ? '#ff5252' : '#ff1744'
      }
    ]}>
      <View style={styles.content}>
        <Ionicons 
          name="wifi-outline" 
          size={20} 
          color="#fff" 
          style={styles.icon}
        />
        <Text style={styles.message}>
          {customMessage || 'Internet aloqasi yo\'q'}
        </Text>
        {showRetryButton && (
          <Pressable 
            style={styles.retryButton} 
            onPress={handleRetry}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.retryText}>Qayta urinib ko\'rish</Text>
            {retryCount > 0 && (
              <Text style={styles.retryCount}>({retryCount})</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface OfflineAwareComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  onDataNeeded?: () => Promise<void>;
}

export function OfflineAwareComponent({
  children,
  fallback,
  loadingComponent,
  onDataNeeded,
}: OfflineAwareComponentProps) {
  const networkStatus = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ((networkStatus.isConnected && networkStatus.isInternetReachable) && onDataNeeded) {
      setIsLoading(true);
      setError(null);
      
      onDataNeeded()
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          setError(err.message || 'Failed to load data');
        });
    }
  }, [networkStatus.isConnected, networkStatus.isInternetReachable, onDataNeeded]);

  if (isLoading) {
    return loadingComponent || (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error && (!networkStatus.isConnected || !networkStatus.isInternetReachable)) {
    return fallback || (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Hook for offline-aware operations
export function useOfflineAware() {
  const networkStatus = useNetworkStatus();
  const { get, set, has } = useOfflineCache();

  const executeWithFallback = useCallback(async function<T>(
    onlineOperation: () => Promise<T>,
    cacheKey: string,
    fallbackData?: T
  ): Promise<T> {
    try {
      if (networkStatus.isConnected && networkStatus.isInternetReachable) {
        // Try online operation first
        const result = await onlineOperation();
        
        // Cache the result for offline use
        await set(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours TTL
        
        return result;
      } else {
        // Try to get from cache
        const cachedData = await get<T>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
        
        // Use fallback data if available
        if (fallbackData !== undefined) {
          return fallbackData;
        }
        
        throw new Error('No internet connection and no cached data available');
      }
    } catch (error) {
      // If online operation fails, try cache
      const cachedData = await get<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Use fallback data if available
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      
      throw error;
    }
  }, [networkStatus.isConnected, networkStatus.isInternetReachable, get, set]);

  const preloadData = useCallback(async (
    cacheKey: string,
    data: any,
    ttl?: number
  ): Promise<void> => {
    await set(cacheKey, data, ttl);
  }, [set]);

  const getCachedData = useCallback(async function<T>(cacheKey: string): Promise<T | null> {
    return get<T>(cacheKey);
  }, [get]);

  const hasCachedData = useCallback(async (cacheKey: string): Promise<boolean> => {
    return has(cacheKey);
  }, [has]);

  return {
    isOnline: networkStatus.isConnected && networkStatus.isInternetReachable,
    isOffline: !networkStatus.isConnected || !networkStatus.isInternetReachable,
    connectionType: networkStatus.connectionType,
    connectionStrength: networkStatus.connectionStrength,
    executeWithFallback,
    preloadData,
    getCachedData,
    hasCachedData,
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  retryCount: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.7,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
