import { useState, useEffect, useCallback, useRef } from 'react';

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  storage: 'memory' | 'asyncStorage';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    evictions: 0,
  };
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanup();
  }

  private startCleanup() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.size--;
    });
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    };

    // Check if we need to evict oldest entries
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size--;
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// API Cache Manager
class APICacheManager {
  private cache: CacheManager;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.cache = new CacheManager({
      maxSize: 100,
      ttl: 5 * 60 * 1000, // 5 minutes
      storage: 'memory',
    });
  }

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  async get<T>(url: string, options?: RequestInit, fetchFn?: () => Promise<T>): Promise<T> {
    const key = this.generateKey(url, options);
    
    // Check cache first
    const cached = this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Make the request
    const promise = this.makeRequest<T>(key, fetchFn || this.defaultFetch.bind(this, url, options));
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async makeRequest<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    try {
      const data = await fetchFn();
      this.cache.set(key, data);
      return data;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  private async defaultFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  invalidate(url: string, options?: RequestInit): void {
    const key = this.generateKey(url, options);
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  getStats() {
    return this.cache.getStats();
  }
}

// React Hook for API caching
export function useAPICache() {
  const cacheManager = useRef(new APICacheManager()).current;

  const cachedFetch = useCallback(async <T>(
    url: string,
    options?: RequestInit,
    customTtl?: number
  ): Promise<T> => {
    return cacheManager.get(url, options);
  }, [cacheManager]);

  const invalidate = useCallback((url: string, options?: RequestInit) => {
    cacheManager.invalidate(url, options);
  }, [cacheManager]);

  const invalidatePattern = useCallback((pattern: string) => {
    cacheManager.invalidatePattern(pattern);
  }, [cacheManager]);

  const clear = useCallback(() => {
    cacheManager.clear();
  }, [cacheManager]);

  const getStats = useCallback(() => {
    return cacheManager.getStats();
  }, [cacheManager]);

  return {
    cachedFetch,
    invalidate,
    invalidatePattern,
    clear,
    getStats,
  };
}

// React Hook for memory management
export function useMemoryManagement() {
  const [memoryStats, setMemoryStats] = useState({
    used: 0,
    total: 0,
    percentage: 0,
  });

  useEffect(() => {
    const updateMemoryStats = () => {
      if (Platform.OS === 'web') {
        // Web memory stats
        const used = (performance as any).memory?.usedJSHeapSize || 0;
        const total = (performance as any).memory?.totalJSHeapSize || 0;
        const percentage = total > 0 ? (used / total) * 100 : 0;
        
        setMemoryStats({ used, total, percentage });
      } else {
        // React Native memory stats (limited)
        setMemoryStats({
          used: 0,
          total: 0,
          percentage: 0,
        });
      }
    };

    updateMemoryStats();
    const interval = setInterval(updateMemoryStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const cleanup = useCallback(() => {
    // Force garbage collection if available
    if (Platform.OS === 'web' && (window as any).gc) {
      (window as any).gc();
    }
  }, []);

  return {
    memoryStats,
    cleanup,
  };
}

// React Hook for preventing memory leaks
export function usePreventMemoryLeak() {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup all registered functions
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  return { addCleanup };
}

// React Hook for optimized useEffect
export function useOptimizedEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  options?: {
    debounce?: number;
    throttle?: number;
    cleanup?: () => void;
  }
) {
  const { debounce = 0, throttle = 0, cleanup } = options || {};

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastExecution = 0;

    const executeEffect = () => {
      if (debounce > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(effect, debounce);
      } else if (throttle > 0) {
        const now = Date.now();
        if (now - lastExecution >= throttle) {
          effect();
          lastExecution = now;
        }
      } else {
        effect();
      }
    };

    executeEffect();

    return () => {
      if (debounce > 0) {
        clearTimeout(timeoutId);
      }
      cleanup?.();
    };
  }, deps);
}

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    renderTimes.current.push(renderTime);
    lastRenderTime.current = now;

    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10);
    }

    // Log performance warnings
    if (renderTime > 100) {
      console.warn(`[Performance] ${componentName} slow render: ${renderTime}ms`);
    }

    if (renderCount.current % 10 === 0) {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      console.log(`[Performance] ${componentName} renders: ${renderCount.current}, avg: ${avgRenderTime.toFixed(2)}ms`);
    }
  });

  const getPerformanceStats = useCallback(() => {
    const avgRenderTime = renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0;
    
    return {
      renderCount: renderCount.current,
      averageRenderTime: avgRenderTime,
      lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
    };
  }, []);

  return {
    getPerformanceStats,
    renderCount: renderCount.current,
  };
}

// Global cache instance
export const apiCache = new APICacheManager();

// Utility functions
export const preloadImage = (uri: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = uri;
  });
};

export const preloadImages = (uris: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(uris.map(preloadImage));
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default {
  CacheManager,
  APICacheManager,
  useAPICache,
  useMemoryManagement,
  usePreventMemoryLeak,
  useOptimizedEffect,
  usePerformanceMonitor,
  apiCache,
  preloadImage,
  preloadImages,
  debounce,
  throttle,
};
