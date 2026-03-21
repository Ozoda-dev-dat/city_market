import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricService {
  isSupported: boolean;
  isEnabled: boolean;
  authenticate: (reason?: string) => Promise<boolean>;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
  checkBiometrics: () => Promise<LocalAuthentication.AuthenticationResult>;
}

class EnhancedBiometricService implements BiometricService {
  private readonly STORAGE_KEY = 'biometric_enabled';

  constructor() {
    this.isSupported = LocalAuthentication.isSupportedAsync();
  }

  async isEnabled(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  async authenticate(reason?: string): Promise<boolean> {
    try {
      const hasPermission = await this.checkBiometrics();
      if (!hasPermission.success) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      // Store successful authentication for analytics
      if (result.success) {
        await this.trackBiometricEvent('authentication_success', reason);
      } else {
        await this.trackBiometricEvent('authentication_failed', reason);
      }

      return result.success;
    } catch (error: any) {
      await this.trackBiometricEvent('authentication_error', error?.message);
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async enable(): Promise<boolean> {
    try {
      const hasPermission = await this.checkBiometrics();
      if (!hasPermission.success) {
        throw new Error('Biometric authentication not available');
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, 'true');
      await this.trackBiometricEvent('biometric_enabled');
      console.log('Biometric authentication enabled');
      return true;
    } catch (error: any) {
      await this.trackBiometricEvent('biometric_enable_failed', error?.message);
      console.error('Error enabling biometrics:', error);
      return false;
    }
  }

  async disable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, 'false');
      await this.trackBiometricEvent('biometric_disabled');
      console.log('Biometric authentication disabled');
      return true;
    } catch (error: any) {
      await this.trackBiometricEvent('biometric_disable_failed', error?.message);
      console.error('Error disabling biometrics:', error);
      return false;
    }
  }

  private async checkBiometrics(): Promise<LocalAuthentication.AuthenticationResult> {
    try {
      return await LocalAuthentication.authenticateAsync({
        promptMessage: 'Check biometric availability',
        disableDeviceFallback: true,
      });
    } catch (error: any) {
      console.error('Error checking biometrics:', error);
      return { success: false, error: error?.message };
    }
  }

  private async trackBiometricEvent(event: string, details?: string): Promise<void> {
    try {
      // Import analytics service dynamically to avoid circular dependency
      const { default: AnalyticsService } = await import('./AnalyticsService');
      const analytics = new AnalyticsService();
      await analytics.trackEvent(`biometric_${event}`, details ? { details } : {});
    } catch (error: any) {
      console.error('Error tracking biometric event:', error);
    }
  }
}
