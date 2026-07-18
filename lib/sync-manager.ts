import { logger } from './data-security';
import { offlineCache } from './offline-cache';
import { NetworkManager } from './network-manager';
import { getApiUrl } from './query-client';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  priority: number;
}

export interface SyncResult {
  success: boolean;
  operations: SyncOperation[];
  errors: string[];
  syncedCount: number;
  failedCount: number;
  duration: number;
}

export interface SyncConflict {
  operation: SyncOperation;
  serverData: any;
  localData: any;
  conflictType: 'version' | 'data' | 'deleted';
  timestamp: string;
}

class SyncManager {
  private static instance: SyncManager;
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private conflicts: SyncConflict[] = [];
  private networkManager: NetworkManager;
  private syncInProgress = false;

  constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.loadSyncQueue();
    this.setupNetworkListener();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private setupNetworkListener(): void {
    this.networkManager.subscribeToEvents((event) => {
      if (event.type === 'connected' || event.type === 'reconnected') {
        // Start sync when coming back online
        this.syncWhenOnline();
      }
    });
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem('@freshmart_sync_queue');
      if (queueStr) {
        this.syncQueue = JSON.parse(queueStr);
        logger.info('Sync queue loaded', { operations: this.syncQueue.length });
      }
    } catch (error) {
      logger.error('Failed to load sync queue', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('@freshmart_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      logger.error('Failed to save sync queue', error);
    }
  }

  addOperation(
    type: 'create' | 'update' | 'delete',
    entity: string,
    data: any,
    priority: number = 0
  ): string {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type,
      entity,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      priority,
    };

    this.syncQueue.push(operation);
    this.syncQueue.sort((a, b) => b.priority - a.priority); // Sort by priority

    this.saveSyncQueue();
    
    // Try to sync immediately if online
    this.syncWhenOnline();

    logger.info('Sync operation added', { 
      id: operation.id, 
      type, 
      entity, 
      priority 
    });

    return operation.id;
  }

  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async syncWhenOnline(): Promise<void> {
    const status = this.networkManager.getStatus();
    if (status.isConnected && status.isInternetReachable && !this.isSyncing) {
      await this.sync();
    }
  }

  async sync(): Promise<SyncResult> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return {
        success: true,
        operations: [],
        errors: [],
        syncedCount: 0,
        failedCount: 0,
        duration: 0,
      };
    }

    this.isSyncing = true;
    this.syncInProgress = true;
    const startTime = Date.now();

    const result: SyncResult = {
      success: true,
      operations: [],
      errors: [],
      syncedCount: 0,
      failedCount: 0,
      duration: 0,
    };

    try {
      logger.info('Starting sync process', { 
        operations: this.syncQueue.length 
      });

      const operationsToProcess = [...this.syncQueue];
      const failedOperations: SyncOperation[] = [];

      for (const operation of operationsToProcess) {
        try {
          await this.processOperation(operation);
          result.syncedCount++;
          
          // Remove successful operation from queue
          this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
          
          logger.info('Operation synced successfully', { 
            id: operation.id, 
            type: operation.type 
          });
          
        } catch (error) {
          result.success = false;
          result.failedCount++;
          result.errors.push(`${operation.entity}:${operation.id} - ${error.message}`);
          
          // Handle retry logic
          operation.retryCount++;
          if (operation.retryCount < operation.maxRetries) {
            failedOperations.push(operation);
            logger.warn('Operation failed, will retry', { 
              id: operation.id, 
              retryCount: operation.retryCount 
            });
          } else {
            logger.error('Operation failed permanently', { 
              id: operation.id, 
              error 
            });
          }
        }
      }

      // Update queue with failed operations
      this.syncQueue = failedOperations;
      await this.saveSyncQueue();

      this.lastSyncTime = new Date().toISOString();
      result.duration = Date.now() - startTime;
      result.operations = operationsToProcess;

      logger.info('Sync completed', {
        success: result.success,
        synced: result.syncedCount,
        failed: result.failedCount,
        duration: result.duration,
        remaining: this.syncQueue.length,
      });

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync process failed: ${error.message}`);
      logger.error('Sync process failed', error);
    } finally {
      this.isSyncing = false;
      this.syncInProgress = false;
    }

    return result;
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const apiUrl = getApiUrl();
    
    switch (operation.entity) {
      case 'cart':
        await this.syncCartOperation(apiUrl, operation);
        break;
      case 'user':
        await this.syncUserOperation(apiUrl, operation);
        break;
      case 'order':
        await this.syncOrderOperation(apiUrl, operation);
        break;
      case 'product':
        await this.syncProductOperation(apiUrl, operation);
        break;
      default:
        await this.syncGenericOperation(apiUrl, operation);
        break;
    }
  }

  private async syncCartOperation(apiUrl: string, operation: SyncOperation): Promise<void> {
    const endpoint = `${apiUrl}/api/cart/sync`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operation.data.token}`,
      },
      body: JSON.stringify({
        operation: operation.type,
        data: operation.data,
        timestamp: operation.timestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cart sync failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Check for conflicts
    if (result.conflict) {
      this.handleConflict(operation, result.serverData, result.conflict);
    }
  }

  private async syncUserOperation(apiUrl: string, operation: SyncOperation): Promise<void> {
    const endpoint = `${apiUrl}/api/user/sync`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operation.data.token}`,
      },
      body: JSON.stringify({
        operation: operation.type,
        data: operation.data,
        timestamp: operation.timestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(`User sync failed: ${response.status}`);
    }
  }

  private async syncOrderOperation(apiUrl: string, operation: SyncOperation): Promise<void> {
    const endpoint = `${apiUrl}/api/orders`;
    
    let response: Response;
    
    switch (operation.type) {
      case 'create':
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${operation.data.token}`,
          },
          body: JSON.stringify(operation.data),
        });
        break;
      case 'update':
        response = await fetch(`${endpoint}/${operation.data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${operation.data.token}`,
          },
          body: JSON.stringify(operation.data),
        });
        break;
      case 'delete':
        response = await fetch(`${endpoint}/${operation.data.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${operation.data.token}`,
          },
        });
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    if (!response.ok) {
      throw new Error(`Order sync failed: ${response.status}`);
    }
  }

  private async syncProductOperation(apiUrl: string, operation: SyncOperation): Promise<void> {
    // Products are typically read-only, so sync operations might be limited
    logger.warn('Product sync operation attempted', { operation });
  }

  private async syncGenericOperation(apiUrl: string, operation: SyncOperation): Promise<void> {
    const endpoint = `${apiUrl}/api/sync/${operation.entity}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: operation.type,
        data: operation.data,
        timestamp: operation.timestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(`Generic sync failed: ${response.status}`);
    }
  }

  private handleConflict(
    operation: SyncOperation, 
    serverData: any, 
    conflictType: string
  ): void {
    const conflict: SyncConflict = {
      operation,
      serverData,
      localData: operation.data,
      conflictType: conflictType as any,
      timestamp: new Date().toISOString(),
    };

    this.conflicts.push(conflict);
    
    logger.warn('Sync conflict detected', {
      operationId: operation.id,
      conflictType,
    });
  }

  async resolveConflict(
    conflictId: string, 
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): Promise<void> {
    const conflictIndex = this.conflicts.findIndex(c => 
      `${c.operation.id}_${c.timestamp}` === conflictId
    );

    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = this.conflicts[conflictIndex];

    try {
      switch (resolution) {
        case 'local':
          // Force local data to server
          await this.forceSyncOperation(conflict.operation, conflict.localData);
          break;
        case 'server':
          // Accept server data, update local cache
          await offlineCache.set(
            `${conflict.operation.entity}_${conflict.operation.data.id}`,
            conflict.serverData,
            24 * 60 * 60 * 1000
          );
          break;
        case 'merge':
          if (!mergedData) {
            throw new Error('Merged data required for merge resolution');
          }
          await this.forceSyncOperation(conflict.operation, mergedData);
          break;
      }

      // Remove conflict from list
      this.conflicts.splice(conflictIndex, 1);
      
      logger.info('Conflict resolved', { 
        conflictId, 
        resolution 
      });
    } catch (error) {
      logger.error('Failed to resolve conflict', { 
        conflictId, 
        resolution, 
        error 
      });
      throw error;
    }
  }

  private async forceSyncOperation(operation: SyncOperation, data: any): Promise<void> {
    // Create a new operation with the resolved data
    const resolvedOperation = {
      ...operation,
      data,
      id: this.generateOperationId(),
      retryCount: 0,
    };

    await this.processOperation(resolvedOperation);
  }

  getSyncStatus(): {
    isSyncing: boolean;
    queueSize: number;
    lastSyncTime: string | null;
    conflicts: number;
    syncInProgress: boolean;
  } {
    return {
      isSyncing: this.isSyncing,
      queueSize: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      conflicts: this.conflicts.length,
      syncInProgress: this.syncInProgress,
    };
  }

  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  clearQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
    logger.info('Sync queue cleared');
  }

  clearConflicts(): void {
    this.conflicts = [];
    logger.info('Sync conflicts cleared');
  }

  async forceSync(): Promise<SyncResult> {
    const status = this.networkManager.getStatus();
    if (!status.isConnected || !status.isInternetReachable) {
      throw new Error('No internet connection available');
    }

    return await this.sync();
  }
}

// React Hook for sync management
export function useSyncManager() {
  const syncManager = SyncManager.getInstance();
  const [syncStatus, setSyncStatus] = useState(syncManager.getSyncStatus());
  const [conflicts, setConflicts] = useState(syncManager.getConflicts());

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(syncManager.getSyncStatus());
      setConflicts(syncManager.getConflicts());
    }, 1000);

    return () => clearInterval(interval);
  }, [syncManager]);

  const addOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    entity: string,
    data: any,
    priority?: number
  ) => {
    return syncManager.addOperation(type, entity, data, priority);
  }, [syncManager]);

  const sync = useCallback(async () => {
    return syncManager.sync();
  }, [syncManager]);

  const forceSync = useCallback(async () => {
    return syncManager.forceSync();
  }, [syncManager]);

  const resolveConflict = useCallback((
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ) => {
    return syncManager.resolveConflict(conflictId, resolution, mergedData);
  }, [syncManager]);

  const clearQueue = useCallback(() => {
    syncManager.clearQueue();
  }, [syncManager]);

  const clearConflicts = useCallback(() => {
    syncManager.clearConflicts();
  }, [syncManager]);

  return {
    syncStatus,
    conflicts,
    addOperation,
    sync,
    forceSync,
    resolveConflict,
    clearQueue,
    clearConflicts,
  };
}

// Global instance
export const syncManager = SyncManager.getInstance();

export default SyncManager;
