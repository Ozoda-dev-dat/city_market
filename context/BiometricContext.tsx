import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BiometricContextType = {
  isSupported: boolean;
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  authenticate: () => Promise<boolean>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  checkSupport: () => Promise<void>;
};

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkSupport();
    loadBiometricSetting();
  }, []);

  const checkSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(compatible && enrolled);
    } catch (error) {
      console.log('Error checking biometric support:', error);
      setIsSupported(false);
    }
  };

  const loadBiometricSetting = async () => {
    try {
      const saved = await AsyncStorage.getItem('biometricEnabled');
      if (saved !== null) {
        setBiometricEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading biometric setting:', error);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access the app',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });
      
      setIsAuthenticated(result.success);
      return result.success;
    } catch (error) {
      console.log('Authentication error:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      const result = await authenticate();
      if (result) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem('biometricEnabled', JSON.stringify(true));
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error enabling biometric:', error);
      return false;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      setBiometricEnabled(false);
      await AsyncStorage.setItem('biometricEnabled', JSON.stringify(false));
    } catch (error) {
      console.log('Error disabling biometric:', error);
    }
  };

  return (
    <BiometricContext.Provider
      value={{
        isSupported,
        isAuthenticated,
        biometricEnabled,
        authenticate,
        enableBiometric,
        disableBiometric,
        checkSupport,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometric must be used within BiometricProvider');
  }
  return context;
}
