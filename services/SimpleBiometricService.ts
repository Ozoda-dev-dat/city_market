import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricService {
  isEnabled: () => Promise<boolean>;
  authenticate: (reason?: string) => Promise<boolean>;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
}

class SimpleBiometricService implements BiometricService {
  private readonly STORAGE_KEY = 'biometric_enabled';

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
      // For now, just simulate successful authentication
      // In a real implementation, you would use expo-local-authentication
      console.log('Biometric authentication attempted:', reason);
      
      // Simulate success for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async enable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, 'true');
      console.log('Biometric authentication enabled');
      return true;
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      return false;
    }
  }

  async disable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, 'false');
      console.log('Biometric authentication disabled');
      return true;
    } catch (error) {
      console.error('Error disabling biometrics:', error);
      return false;
    }
  }
}

export default SimpleBiometricService;
