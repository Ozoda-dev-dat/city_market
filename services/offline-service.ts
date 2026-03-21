import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

export interface OfflineQueueItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingItems: number;
  failedItems: number;
}

export interface OfflineStorage {
  products: any[];
  categories: any[];
  orders: any[];
  user: any;
  lastUpdated: number;
}

export class OfflineService extends EventEmitter {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncQueue: OfflineQueueItem[] = [];
  private storage: OfflineStorage = {
    products: [],
    categories: [],
    orders: [],
    user: null,
    lastUpdated: 0
  };

  private constructor() {
    super();
    this.initializeNetworkListener();
    this.loadStorage();
    this.startSyncProcess();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Network monitoring
  private async initializeNetworkListener(): Promise<void> {
    try {
      // Listen for network state changes
      const unsubscribe = NetInfo.addEventListener(state => {
        this.handleNetworkChange(state.isConnected);
      });

      // Check initial network state
      const state = await NetInfo.fetch();
      this.handleNetworkChange(state.isConnected);
    } catch (error) {
      console.error('Failed to initialize network listener:', error);
    }
  }

  private handleNetworkChange(isConnected: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isConnected;

    if (isConnected && !wasOnline) {
      // Just came online - start syncing
      this.emit('online');
      this.startSync();
    } else if (!isConnected && wasOnline) {
      // Just went offline
      this.emit('offline');
    }

    this.emit('networkChange', { isConnected, wasOnline });
  }

  // Storage management
  private async loadStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_storage');
      if (stored) {
        this.storage = JSON.parse(stored);
      }

      const queue = await AsyncStorage.getItem('sync_queue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to load offline storage:', error);
    }
  }

  private async saveStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_storage', JSON.stringify(this.storage));
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save offline storage:', error);
    }
  }

  // Data caching
  async cacheData(key: keyof OfflineStorage, data: any): Promise<void> {
    try {
      this.storage[key] = data;
      this.storage.lastUpdated = Date.now();
      await this.saveStorage();
      this.emit('dataCached', { key, timestamp: Date.now() });
    } catch (error) {
      console.error(`Failed to cache ${key}:`, error);
    }
  }

  async getCachedData(key: keyof OfflineStorage): Promise<any> {
    try {
      return this.storage[key];
    } catch (error) {
      console.error(`Failed to get cached ${key}:`, error);
      return null;
    }
  }

  async clearCache(key?: keyof OfflineStorage): Promise<void> {
    try {
      if (key) {
        this.storage[key] = Array.isArray(this.storage[key]) ? [] : null;
      } else {
        this.storage = {
          products: [],
          categories: [],
          orders: [],
          user: null,
          lastUpdated: 0
        };
      }
      this.storage.lastUpdated = Date.now();
      await this.saveStorage();
      this.emit('cacheCleared', { key });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Sync queue management
  async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.push(queueItem);
    await this.saveStorage();
    this.emit('itemQueued', queueItem);

    if (this.isOnline && !this.isSyncing) {
      this.startSync();
    }
  }

  async removeFromQueue(id: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    await this.saveStorage();
    this.emit('itemRemovedFromQueue', { id });
  }

  async updateQueueItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    const index = this.syncQueue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.syncQueue[index] = { ...this.syncQueue[index], ...updates };
      await this.saveStorage();
      this.emit('queueItemUpdated', { id, updates });
    }
  }

  // Sync process
  private startSync(): void {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.emit('syncStarted');

    this.processSyncQueue()
      .then(() => {
        this.isSyncing = false;
        this.emit('syncCompleted');
      })
      .catch(error => {
        this.isSyncing = false;
        console.error('Sync failed:', error);
        this.emit('syncFailed', error);
      });
  }

  private async processSyncQueue(): Promise<void> {
    const itemsToSync = [...this.syncQueue];
    const results = [];

    for (const item of itemsToSync) {
      try {
        const result = await this.syncItem(item);
        results.push({ item, result, success: true });
        await this.removeFromQueue(item.id);
      } catch (error) {
        const updatedItem = { ...item, retryCount: item.retryCount + 1 };
        
        if (updatedItem.retryCount >= updatedItem.maxRetries) {
          // Max retries reached, remove from queue
          await this.removeFromQueue(item.id);
          results.push({ item, error, success: false, maxRetriesReached: true });
        } else {
          // Update retry count and keep in queue
          await this.updateQueueItem(item.id, { retryCount: updatedItem.retryCount });
          results.push({ item, error, success: false, willRetry: true });
        }
      }
    }

    this.emit('syncProgress', { results, total: itemsToSync.length });
  }

  private async syncItem(item: OfflineQueueItem): Promise<any> {
    const { type, endpoint, data } = item;
    
    try {
      let response;
      
      switch (type) {
        case 'CREATE':
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getAuthToken()}`
            },
            body: JSON.stringify(data)
          });
          break;
          
        case 'UPDATE':
          response = await fetch(`${endpoint}/${data.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getAuthToken()}`
            },
            body: JSON.stringify(data)
          });
          break;
          
        case 'DELETE':
          response = await fetch(`${endpoint}/${data.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${await this.getAuthToken()}`
            }
          });
          break;
          
        default:
          throw new Error(`Unknown sync type: ${type}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Sync item failed:', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token || '';
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return '';
    }
  }

  // Background sync
  private startSyncProcess(): void {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.startSync();
      }
    }, 30000);

    // Sync when app comes to foreground
    this.on('online', () => {
      if (!this.isSyncing) {
        this.startSync();
      }
    });
  }

  // Data synchronization
  async syncWithServer(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;
    this.emit('syncStarted');

    try {
      // Sync products
      await this.syncProducts();
      
      // Sync categories
      await this.syncCategories();
      
      // Sync orders
      await this.syncOrders();
      
      // Process queue
      await this.processSyncQueue();
      
      this.storage.lastUpdated = Date.now();
      await this.saveStorage();
      
      this.isSyncing = false;
      this.emit('syncCompleted');
    } catch (error) {
      this.isSyncing = false;
      this.emit('syncFailed', error);
      throw error;
    }
  }

  private async syncProducts(): Promise<void> {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const products = await response.json();
        await this.cacheData('products', products);
      }
    } catch (error) {
      console.error('Failed to sync products:', error);
    }
  }

  private async syncCategories(): Promise<void> {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const categories = await response.json();
        await this.cacheData('categories', categories);
      }
    } catch (error) {
      console.error('Failed to sync categories:', error);
    }
  }

  private async syncOrders(): Promise<void> {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const orders = await response.json();
        await this.cacheData('orders', orders);
      }
    } catch (error) {
      console.error('Failed to sync orders:', error);
    }
  }

  // Status and utilities
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.storage.lastUpdated,
      pendingItems: this.syncQueue.length,
      failedItems: this.syncQueue.filter(item => item.retryCount > 0).length
    };
  }

  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncWithServer();
  }

  async clearQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveStorage();
    this.emit('queueCleared');
  }

  // Offline operations
  async createOrder(orderData: any): Promise<void> {
    if (this.isOnline) {
      // Try to create online first
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`
          },
          body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
          const order = await response.json();
          // Add to local cache
          const orders = this.storage.orders || [];
          orders.push(order);
          await this.cacheData('orders', orders);
          return;
        }
      } catch (error) {
        console.error('Failed to create order online, queuing for sync:', error);
      }
    }

    // Queue for offline sync
    await this.addToQueue({
      type: 'CREATE',
      endpoint: '/api/orders',
      data: orderData,
      maxRetries: 5
    });

    // Add to local cache immediately
    const orders = this.storage.orders || [];
    const localOrder = {
      ...orderData,
      id: this.generateId(),
      status: 'pending_sync',
      createdAt: Date.now()
    };
    orders.push(localOrder);
    await this.cacheData('orders', orders);
  }

  async updateOrder(orderId: string, updateData: any): Promise<void> {
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          const updatedOrder = await response.json();
          // Update local cache
          const orders = this.storage.orders || [];
          const index = orders.findIndex((order: any) => order.id === orderId);
          if (index !== -1) {
            orders[index] = updatedOrder;
            await this.cacheData('orders', orders);
          }
          return;
        }
      } catch (error) {
        console.error('Failed to update order online, queuing for sync:', error);
      }
    }

    // Queue for offline sync
    await this.addToQueue({
      type: 'UPDATE',
      endpoint: '/api/orders',
      data: { ...updateData, id: orderId },
      maxRetries: 5
    });

    // Update local cache immediately
    const orders = this.storage.orders || [];
    const index = orders.findIndex((order: any) => order.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updateData, status: 'pending_sync' };
      await this.cacheData('orders', orders);
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`
          }
        });
        
        if (response.ok) {
          // Remove from local cache
          const orders = this.storage.orders || [];
          const filteredOrders = orders.filter((order: any) => order.id !== orderId);
          await this.cacheData('orders', filteredOrders);
          return;
        }
      } catch (error) {
        console.error('Failed to delete order online, queuing for sync:', error);
      }
    }

    // Queue for offline sync
    await this.addToQueue({
      type: 'DELETE',
      endpoint: '/api/orders',
      data: { id: orderId },
      maxRetries: 5
    });

    // Remove from local cache immediately
    const orders = this.storage.orders || [];
    const filteredOrders = orders.filter((order: any) => order.id !== orderId);
    await this.cacheData('orders', filteredOrders);
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  async cleanupOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoffTime = Date.now() - maxAge;
      
      // Clean up old sync queue items
      this.syncQueue = this.syncQueue.filter(item => item.timestamp > cutoffTime);
      
      // Clean up old cached data
      if (this.storage.lastUpdated < cutoffTime) {
        this.storage = {
          products: [],
          categories: [],
          orders: [],
          user: this.storage.user, // Keep user data
          lastUpdated: Date.now()
        };
      }
      
      await this.saveStorage();
      this.emit('cacheCleaned');
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  // Export/Import for debugging
  async exportData(): Promise<any> {
    return {
      storage: this.storage,
      syncQueue: this.syncQueue,
      status: this.getSyncStatus()
    };
  }

  async importData(data: any): Promise<void> {
    try {
      this.storage = data.storage || this.storage;
      this.syncQueue = data.syncQueue || this.syncQueue;
      await this.saveStorage();
      this.emit('dataImported');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}

export const offlineService = OfflineService.getInstance();
