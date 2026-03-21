import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './data-security';

export interface OfflineCacheEntry<T> {
  data: T;
  timestamp: string;
  ttl: number; // Time to live in milliseconds
  version: string;
  isOfflineData: boolean;
  lastAccessed: string;
}

export interface CacheConfig {
  maxSize: number; // Maximum number of entries
  maxAge: number; // Default TTL in milliseconds
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

class OfflineCacheManager {
  private static instance: OfflineCacheManager;
  private cache: Map<string, OfflineCacheEntry<any>> = new Map();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cleanups: 0,
    size: 0,
  };

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: 1000,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      compressionEnabled: true,
      encryptionEnabled: false,
      ...config,
    };

    this.startCleanup();
    this.loadCacheFromStorage();
  }

  static getInstance(config?: CacheConfig): OfflineCacheManager {
    if (!OfflineCacheManager.instance) {
      OfflineCacheManager.instance = new OfflineCacheManager(config);
    }
    return OfflineCacheManager.instance;
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cacheStr = await AsyncStorage.getItem('@freshmart_offline_cache');
      if (cacheStr) {
        const cacheData = JSON.parse(cacheStr);
        
        // Restore cache entries
        for (const [key, entry] of Object.entries(cacheData.entries || {})) {
          this.cache.set(key, entry as OfflineCacheEntry<any>);
        }
        
        this.stats.size = this.cache.size;
        logger.info('Offline cache loaded from storage', { 
          entries: this.cache.size,
          stats: this.stats 
        });
      }
    } catch (error) {
      logger.error('Failed to load offline cache from storage', error);
    }
  }

  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheData = {
        entries: Object.fromEntries(this.cache),
        stats: this.stats,
        config: this.config,
      };
      
      await AsyncStorage.setItem('@freshmart_offline_cache', JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Failed to save offline cache to storage', error);
    }
  }

  private startCleanup(): void {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Check if entry is expired
      if (now - new Date(entry.timestamp).getTime() > entry.ttl) {
        keysToDelete.push(key);
        deletedCount++;
        continue;
      }

      // Check if entry hasn't been accessed in a long time (7 days)
      const lastAccessed = new Date(entry.lastAccessed).getTime();
      if (now - lastAccessed > 7 * 24 * 60 * 60 * 1000) {
        keysToDelete.push(key);
        deletedCount++;
      }
    }

    // Delete expired entries
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    // Enforce max size
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => 
        new Date(a[1].lastAccessed).getTime() - new Date(b[1].lastAccessed).getTime()
      );

      const excessCount = this.cache.size - this.config.maxSize;
      for (let i = 0; i < excessCount; i++) {
        this.cache.delete(entries[i][0]);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.stats.cleanups++;
      this.stats.size = this.cache.size;
      logger.info(`Cache cleanup completed`, { 
        deleted: deletedCount,
        total: this.cache.size 
      });
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    version: string = '1.0'
  ): Promise<void> {
    const entry: OfflineCacheEntry<T> = {
      data,
      timestamp: new Date().toISOString(),
      ttl: ttl || this.config.maxAge,
      version,
      isOfflineData: true,
      lastAccessed: new Date().toISOString(),
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;

    await this.saveCacheToStorage();
    
    logger.debug('Data cached offline', { key, ttl: entry.ttl });
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const timestamp = new Date(entry.timestamp).getTime();

    // Check if entry is expired
    if (now - timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = new Date().toISOString();
    this.stats.hits++;

    await this.saveCacheToStorage();
    
    logger.debug('Cache hit', { key, age: now - timestamp });
    
    return entry.data;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    const timestamp = new Date(entry.timestamp).getTime();

    // Check if entry is expired
    if (now - timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      await this.saveCacheToStorage();
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.size = 0;
    await this.saveCacheToStorage();
    logger.info('Offline cache cleared');
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    this.stats.size = this.cache.size;
    await this.saveCacheToStorage();
    
    logger.info('Cache pattern invalidated', { pattern, deleted: keysToDelete.length });
    
    return keysToDelete.length;
  }

  getStats() {
    return { ...this.stats };
  }

  getCacheInfo() {
    const entries = Array.from(this.cache.entries());
    const totalSize = entries.reduce((size, [key, entry]) => {
      return size + key.length + JSON.stringify(entry).length;
    }, 0);

    const now = Date.now();
    const expiredCount = entries.filter(([_, entry]) => 
      now - new Date(entry.timestamp).getTime() > entry.ttl
    ).length;

    return {
      totalEntries: this.cache.size,
      totalSize,
      expiredEntries: expiredCount,
      averageEntrySize: totalSize / Math.max(entries.length, 1),
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(([_, entry]) => new Date(entry.timestamp).getTime()))
        : null,
      newestEntry: entries.length > 0 
        ? Math.max(...entries.map(([_, entry]) => new Date(entry.timestamp).getTime()))
        : null,
    };
  }

  async exportCache(): Promise<string> {
    const cacheData = {
      entries: Object.fromEntries(this.cache),
      stats: this.stats,
      config: this.config,
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(cacheData);
  }

  async importCache(cacheDataStr: string): Promise<void> {
    try {
      const cacheData = JSON.parse(cacheDataStr);
      
      // Validate cache data
      if (!cacheData.entries || typeof cacheData.entries !== 'object') {
        throw new Error('Invalid cache data format');
      }

      // Clear existing cache
      this.cache.clear();

      // Import entries
      for (const [key, entry] of Object.entries(cacheData.entries)) {
        this.cache.set(key, entry as OfflineCacheEntry<any>);
      }

      // Update stats
      this.stats = { ...cacheData.stats, size: this.cache.size };
      
      await this.saveCacheToStorage();
      
      logger.info('Cache imported successfully', { 
        entries: this.cache.size 
      });
    } catch (error) {
      logger.error('Failed to import cache', error);
      throw error;
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Offline data preloader
export class OfflineDataPreloader {
  private static instance: OfflineDataPreloader;
  private cacheManager: OfflineCacheManager;
  private isPreloading = false;
  private preloadQueue: Array<{
    key: string;
    url: string;
    ttl?: number;
    priority: number;
  }> = [];

  constructor() {
    this.cacheManager = OfflineCacheManager.getInstance();
  }

  static getInstance(): OfflineDataPreloader {
    if (!OfflineDataPreloader.instance) {
      OfflineDataPreloader.instance = new OfflineDataPreloader();
    }
    return OfflineDataPreloader.instance;
  }

  addToPreloadQueue(
    key: string, 
    url: string, 
    ttl?: number, 
    priority: number = 0
  ): void {
    this.preloadQueue.push({ key, url, ttl, priority });
    
    // Sort by priority (highest first)
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // Start preloading if not already in progress
    this.startPreloading();
  }

  private async startPreloading(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    try {
      while (this.preloadQueue.length > 0) {
        const item = this.preloadQueue.shift();
        if (!item) break;

        try {
          const response = await fetch(item.url);
          if (response.ok) {
            const data = await response.json();
            await this.cacheManager.set(item.key, data, item.ttl);
            
            logger.info('Data preloaded for offline use', { 
              key: item.key, 
              url: item.url 
            });
          }
        } catch (error) {
          logger.warn('Failed to preload data', { 
            key: item.key, 
            url: item.url, 
            error 
          });
        }

        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isPreloading = false;
    }
  }

  getPreloadStatus(): {
    isPreloading: boolean;
    queueSize: number;
  } {
    return {
      isPreloading: this.isPreloading,
      queueSize: this.preloadQueue.length,
    };
  }

  clearQueue(): void {
    this.preloadQueue = [];
  }
}

// React Hook for offline cache
export function useOfflineCache() {
  const cacheManager = OfflineCacheManager.getInstance();
  const [stats, setStats] = useState(cacheManager.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [cacheManager]);

  const get = useCallback(async <T>(key: string): Promise<T | null> => {
    return cacheManager.get<T>(key);
  }, [cacheManager]);

  const set = useCallback(async <T>(
    key: string, 
    data: T, 
    ttl?: number
  ): Promise<void> => {
    return cacheManager.set(key, data, ttl);
  }, [cacheManager]);

  const has = useCallback(async (key: string): Promise<boolean> => {
    return cacheManager.has(key);
  }, [cacheManager]);

  const remove = useCallback(async (key: string): Promise<boolean> => {
    return cacheManager.delete(key);
  }, [cacheManager]);

  const clear = useCallback(async (): Promise<void> => {
    return cacheManager.clear();
  }, [cacheManager]);

  const invalidate = useCallback(async (pattern: string): Promise<number> => {
    return cacheManager.invalidatePattern(pattern);
  }, [cacheManager]);

  return {
    stats,
    get,
    set,
    has,
    remove,
    clear,
    invalidate,
  };
}

// Global instances
export const offlineCache = OfflineCacheManager.getInstance();
export const dataPreloader = OfflineDataPreloader.getInstance();

export default OfflineCacheManager;
