import * as Notifications from 'expo-notifications';

export interface NotificationService {
  scheduleNotification: (title: string, body: string, data?: any) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
}

class ExpoNotificationService implements NotificationService {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  async scheduleNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Schedule notification error:', error);
      throw error;
    }
  }

  async sendLocalNotification(title: string, body: string): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      await Notifications.presentNotificationAsync({
        title,
        body,
        sound: 'default',
      });
    } catch (error) {
      console.error('Present notification error:', error);
      throw error;
    }
  }
}

export default ExpoNotificationService;
