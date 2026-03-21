import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './data-security';

export interface SyncQueueItem {
  id: string;
  type: 'cart_update' | 'user_update' | 'order_create';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedItems: number;
  failedItems: number;
}

export class SyncService {
  private static instance: SyncService;
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private syncInProgress = false;
  private lastSync: string | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadSyncQueue();
    this.startPeriodicSync();
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem('@freshmart_sync_queue');
      if (queueStr) {
        this.syncQueue = JSON.parse(queueStr);
      }
    } catch (error) {
      logger.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('@freshmart_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      logger.error('Failed to save sync queue:', error);
    }
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (!this.syncInProgress) {
        this.syncData();
      }
    }, 5 * 60 * 1000);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queueItem: SyncQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);
    this.saveSyncQueue();
    
    logger.info('Item added to sync queue', {
      type: item.type,
      id: queueItem.id,
    });
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async syncData(): Promise<SyncResult> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return {
        success: true,
        syncedItems: 0,
        failedItems: 0,
      };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
    };

    try {
      logger.info('Starting data sync', { queueLength: this.syncQueue.length });

      const itemsToProcess = [...this.syncQueue];
      const failedItems: SyncQueueItem[] = [];

      for (const item of itemsToProcess) {
        try {
          await this.processSyncItem(item);
          result.syncedItems++;
          
          // Remove successfully synced item from queue
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
          
        } catch (error) {
          result.success = false;
          result.failedItems++;
          
          // Handle retry logic
          item.retryCount++;
          if (item.retryCount < item.maxRetries) {
            failedItems.push(item);
            logger.warn('Sync item failed, will retry', {
              id: item.id,
              type: item.type,
              retryCount: item.retryCount,
            });
          } else {
            logger.error('Sync item failed permanently', {
              id: item.id,
              type: item.type,
              retryCount: item.retryCount,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Update queue with failed items
      this.syncQueue = failedItems;
      await this.saveSyncQueue();

      this.lastSync = new Date().toISOString();
      
      logger.info('Sync completed', {
        syncedItems: result.syncedItems,
        failedItems: result.failedItems,
        queueLength: this.syncQueue.length,
      });

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Sync failed';
      logger.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';
    
    switch (item.type) {
      case 'cart_update':
        await this.syncCartUpdate(apiUrl, item.data);
        break;
      case 'user_update':
        await this.syncUserUpdate(apiUrl, item.data);
        break;
      case 'order_create':
        await this.syncOrderCreate(apiUrl, item.data);
        break;
      default:
        throw new Error(`Unknown sync item type: ${(item as any).type}`);
    }
  }

  private async syncCartUpdate(apiUrl: string, data: any): Promise<void> {
    const response = await fetch(`${apiUrl}/api/cart/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
      },
      body: JSON.stringify({
        items: data.items,
        totalAmount: data.totalAmount,
        totalItems: data.totalItems,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cart sync failed: ${response.status}`);
    }
  }

  private async syncUserUpdate(apiUrl: string, data: any): Promise<void> {
    const response = await fetch(`${apiUrl}/api/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
      },
      body: JSON.stringify(data.userData),
    });

    if (!response.ok) {
      throw new Error(`User sync failed: ${response.status}`);
    }
  }

  private async syncOrderCreate(apiUrl: string, data: any): Promise<void> {
    const response = await fetch(`${apiUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
      },
      body: JSON.stringify(data.orderData),
    });

    if (!response.ok) {
      throw new Error(`Order sync failed: ${response.status}`);
    }
  }

  async forceSyncAll(): Promise<SyncResult> {
    // Add all current local data to sync queue
    const localData = await this.getAllLocalData();
    
    if (localData.cart && localData.cart.items.length > 0) {
      this.addToSyncQueue({
        type: 'cart_update',
        data: localData.cart,
        maxRetries: 3,
      });
    }

    if (localData.user && localData.user.user) {
      this.addToSyncQueue({
        type: 'user_update',
        data: localData.user,
        maxRetries: 3,
      });
    }

    return await this.syncData();
  }

  private async getAllLocalData(): Promise<any> {
    try {
      const [userStr, cartStr] = await Promise.all([
        AsyncStorage.getItem('@freshmart_user'),
        AsyncStorage.getItem('@freshmart_cart'),
      ]);

      return {
        user: userStr ? JSON.parse(userStr) : null,
        cart: cartStr ? JSON.parse(cartStr) : null,
      };
    } catch (error) {
      logger.error('Failed to get local data:', error);
      return { user: null, cart: null };
    }
  }

  getSyncStatus(): {
    isInProgress: boolean;
    queueLength: number;
    lastSync: string | null;
    isOnline: boolean;
  } {
    return {
      isInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      lastSync: this.lastSync,
      isOnline: this.isOnline,
    };
  }

  clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
    logger.info('Sync queue cleared');
  }

  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    
    if (isOnline && !this.syncInProgress) {
      // Start sync when coming back online
      setTimeout(() => this.syncData(), 1000);
    }
  }

  async cleanup(): Promise<void> {
    this.stopPeriodicSync();
    await this.saveSyncQueue();
  }

  // Offline data management
  async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`@freshmart_offline_${key}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }));
    } catch (error) {
      logger.error(`Failed to save offline data for key: ${key}`, error);
    }
  }

  async getOfflineData(key: string): Promise<any> {
    try {
      const dataStr = await AsyncStorage.getItem(`@freshmart_offline_${key}`);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        return parsed.data;
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get offline data for key: ${key}`, error);
      return null;
    }
  }

  async clearOfflineData(key?: string): Promise<void> {
    try {
      if (key) {
        await AsyncStorage.removeItem(`@freshmart_offline_${key}`);
      } else {
        // Clear all offline data
        const keys = await AsyncStorage.getAllKeys();
        const offlineKeys = keys.filter(k => k.startsWith('@freshmart_offline_'));
        await AsyncStorage.multiRemove(offlineKeys);
      }
    } catch (error) {
      logger.error(`Failed to clear offline data for key: ${key}`, error);
    }
  }

  async getOfflineDataSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(k => k.startsWith('@freshmart_offline_'));
      
      let totalSize = 0;
      for (const key of offlineKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      logger.error('Failed to get offline data size:', error);
      return 0;
    }
  }

  // Data validation and cleanup
  async validateOfflineData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(k => k.startsWith('@freshmart_offline_'));
      
      for (const key of offlineKeys) {
        const dataStr = await AsyncStorage.getItem(key);
        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            
            // Check if data is older than 7 days
            const timestamp = new Date(parsed.timestamp);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            if (timestamp < weekAgo) {
              await AsyncStorage.removeItem(key);
              logger.info('Removed expired offline data', { key });
            }
          } catch (parseError) {
            // Remove corrupted data
            await AsyncStorage.removeItem(key);
            logger.warn('Removed corrupted offline data', { key });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to validate offline data:', error);
    }
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();

// Convenience functions
export const addToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) => {
  syncService.addToSyncQueue(item);
};

export const syncData = () => {
  return syncService.syncData();
};

export const forceSyncAll = () => {
  return syncService.forceSyncAll();
};

export const getSyncStatus = () => {
  return syncService.getSyncStatus();
};

export const clearSyncQueue = () => {
  syncService.clearSyncQueue();
};

export const setOnlineStatus = (isOnline: boolean) => {
  syncService.setOnlineStatus(isOnline);
};

export const saveOfflineData = (key: string, data: any) => {
  return syncService.saveOfflineData(key, data);
};

export const getOfflineData = (key: string) => {
  return syncService.getOfflineData(key);
};

export const clearOfflineData = (key?: string) => {
  return syncService.clearOfflineData(key);
};
