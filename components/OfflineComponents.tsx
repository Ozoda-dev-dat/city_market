import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface NetworkContextValue {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string;
  connectionStrength: string;
}

const NetworkContext = React.createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
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
