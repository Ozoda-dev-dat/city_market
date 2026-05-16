import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from './data-security';

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  connectionStrength: 'weak' | 'fair' | 'good' | 'excellent' | null;
  lastConnected: string | null;
  lastDisconnected: string | null;
  reconnectAttempts: number;
}

export interface NetworkEvent {
  type: 'connected' | 'disconnected' | 'reconnected' | 'connection_weak' | 'connection_restored';
  timestamp: string;
  details: any;
}

class NetworkManager {
  private static instance: NetworkManager;
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private eventListeners: ((event: NetworkEvent) => void)[] = [];
  private status: NetworkStatus = {
    isConnected: null,
    isInternetReachable: null,
    connectionType: null,
    connectionStrength: null,
    lastConnected: null,
    lastDisconnected: null,
    reconnectAttempts: 0,
  };
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Get initial network state
      const netInfoState = await NetInfo.fetch();
      this.updateNetworkStatus(netInfoState);

      // Listen for network changes
      NetInfo.addEventListener(this.handleNetworkChange);

      // Start periodic connectivity checks
      this.startConnectivityCheck();

      logger.info('Network manager initialized', this.status);
    } catch (error) {
      logger.error('Failed to initialize network manager', error);
      throw error;
    }
  }

  private handleNetworkChange = (netInfoState: NetInfoState): void => {
    const previousStatus = { ...this.status };
    this.updateNetworkStatus(netInfoState);

    // Emit network events
    if (!previousStatus.isConnected && this.status.isConnected) {
      this.emitEvent({
        type: 'connected',
        timestamp: new Date().toISOString(),
        details: { connectionType: this.status.connectionType },
      });
      this.status.reconnectAttempts = 0;
      this.status.lastConnected = new Date().toISOString();
    } else if (previousStatus.isConnected && !this.status.isConnected) {
      this.emitEvent({
        type: 'disconnected',
        timestamp: new Date().toISOString(),
        details: { reason: 'network_lost' },
      });
      this.status.lastDisconnected = new Date().toISOString();
      this.startReconnectAttempts();
    } else if (previousStatus.isConnected && this.status.isConnected) {
      if (this.status.reconnectAttempts > 0) {
        this.emitEvent({
          type: 'reconnected',
          timestamp: new Date().toISOString(),
          details: { attempts: this.status.reconnectAttempts },
        });
        this.status.reconnectAttempts = 0;
      }
    }

    // Check connection quality
    this.checkConnectionQuality();

    // Notify listeners
    this.notifyListeners();
  };

  private updateNetworkStatus(netInfoState: NetInfoState): void {
    this.status = {
      ...this.status,
      isConnected: netInfoState.isConnected,
      isInternetReachable: netInfoState.isInternetReachable,
      connectionType: netInfoState.type,
      connectionStrength: this.determineConnectionStrength(netInfoState),
    };
  }

  private determineConnectionStrength(netInfoState: NetInfoState): 'weak' | 'fair' | 'good' | 'excellent' | null {
    if (!netInfoState.isConnected || !netInfoState.isInternetReachable) {
      return null;
    }

    const { type, details } = netInfoState;

    if (type === 'wifi') {
      // For WiFi, we can estimate strength based on signal strength if available
      const signalStrength = (details as any)?.signalStrength;
      if (signalStrength !== undefined) {
        if (signalStrength > -50) return 'excellent';
        if (signalStrength > -60) return 'good';
        if (signalStrength > -70) return 'fair';
        return 'weak';
      }
      return 'good'; // Default for WiFi
    }

    if (type === 'cellular') {
      const effectiveType = (details as any)?.effectiveType;
      switch (effectiveType) {
        case '4g': return 'excellent';
        case '3g': return 'good';
        case '2g': return 'fair';
        default: return 'weak';
      }
    }

    return 'fair'; // Default for other connection types
  }

  private checkConnectionQuality(): void {
    if (!this.status.isConnected) return;

    const strength = this.status.connectionStrength;
    if (strength === 'weak' || strength === 'fair') {
      this.emitEvent({
        type: 'connection_weak',
        timestamp: new Date().toISOString(),
        details: { strength },
      });
    }
  }

  private startReconnectAttempts(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const attemptReconnect = async () => {
      if (this.status.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.warn('Max reconnect attempts reached');
        return;
      }

      this.status.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.status.reconnectAttempts - 1), this.maxReconnectDelay);

      logger.info(`Attempting to reconnect (${this.status.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.reconnectTimeout = setTimeout(async () => {
        try {
          const netInfoState = await NetInfo.fetch();
          if (netInfoState.isConnected && netInfoState.isInternetReachable) {
            this.handleNetworkChange(netInfoState);
          } else {
            attemptReconnect();
          }
        } catch (error) {
          logger.error('Reconnect attempt failed', error);
          attemptReconnect();
        }
      }, delay);
    };

    attemptReconnect();
  }

  private startConnectivityCheck(): void {
    // Ping server every 30 seconds to verify internet connectivity
    this.pingInterval = setInterval(async () => {
      if (this.status.isConnected) {
        try {
          await this.pingServer();
        } catch (error) {
          logger.warn('Connectivity check failed', error);
          // Don't immediately disconnect, just log the warning
        }
      }
    }, 30000);
  }

  private async pingServer(): Promise<void> {
    const { getApiUrl } = require('./query-client');
    const baseUrl = getApiUrl().replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'HEAD',
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
  }

  private emitEvent(event: NetworkEvent): void {
    this.eventListeners.forEach(listener => listener(event));
    logger.info('Network event', event);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  subscribeToEvents(listener: (event: NetworkEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  async forceReconnect(): Promise<boolean> {
    try {
      const netInfoState = await NetInfo.fetch();
      this.handleNetworkChange(netInfoState);
      return this.status.isConnected && this.status.isInternetReachable;
    } catch (error) {
      logger.error('Failed to force reconnect', error);
      return false;
    }
  }

  destroy(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.listeners = [];
    this.eventListeners = [];
  }
}

// React Hook for network status
export function useNetworkStatus() {
  const networkManager = NetworkManager.getInstance();
  const [status, setStatus] = useState<NetworkStatus>(networkManager.getStatus());

  useEffect(() => {
    const unsubscribe = networkManager.subscribe(setStatus);
    return unsubscribe;
  }, [networkManager]);

  return status;
}

// React Hook for network events
export function useNetworkEvents() {
  const networkManager = NetworkManager.getInstance();
  const [events, setEvents] = useState<NetworkEvent[]>([]);

  useEffect(() => {
    const unsubscribe = networkManager.subscribeToEvents((event) => {
      setEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
    });
    return unsubscribe;
  }, [networkManager]);

  return events;
}

// Network-aware fetch wrapper
export async function networkAwareFetch(
  url: string,
  options: RequestInit = {},
  fallbackData?: any
): Promise<any> {
  const networkManager = NetworkManager.getInstance();
  const status = networkManager.getStatus();

  if (!status.isConnected) {
    // If offline, try to get cached data
    if (fallbackData) {
      logger.info('Using fallback data for offline request', { url });
      return fallbackData;
    }
    throw new Error('No internet connection available');
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // If request fails and we have fallback data, use it
    if (fallbackData) {
      logger.warn('Request failed, using fallback data', { url, error });
      return fallbackData;
    }
    throw error;
  }
}

// Offline queue for requests
export class OfflineRequestQueue {
  private static instance: OfflineRequestQueue;
  private queue: Array<{
    id: string;
    url: string;
    options: RequestInit;
    timestamp: string;
    retryCount: number;
    maxRetries: number;
  }> = [];
  private isProcessing = false;

  static getInstance(): OfflineRequestQueue {
    if (!OfflineRequestQueue.instance) {
      OfflineRequestQueue.instance = new OfflineRequestQueue();
    }
    return OfflineRequestQueue.instance;
  }

  addRequest(url: string, options: RequestInit = {}, maxRetries = 3): string {
    const request = {
      id: this.generateId(),
      url,
      options,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries,
    };

    this.queue.push(request);
    logger.info('Request added to offline queue', { url, id: request.id });
    
    // Try to process if online
    this.processQueue();
    
    return request.id;
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const networkManager = NetworkManager.getInstance();
    const status = networkManager.getStatus();

    if (!status.isConnected) {
      return;
    }

    this.isProcessing = true;

    try {
      const requestsToProcess = [...this.queue];
      this.queue = [];

      for (const request of requestsToProcess) {
        try {
          await fetch(request.url, request.options);
          logger.info('Offline request processed successfully', { 
            url: request.url, 
            id: request.id 
          });
        } catch (error) {
          logger.warn('Failed to process offline request', { 
            url: request.url, 
            id: request.id, 
            error 
          });

          // Retry logic
          request.retryCount++;
          if (request.retryCount < request.maxRetries) {
            this.queue.push(request);
          } else {
            logger.error('Request exceeded max retries', { 
              url: request.url, 
              id: request.id 
            });
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueStatus(): {
    pending: number;
    processing: boolean;
    oldestRequest: string | null;
  } {
    const oldestRequest = this.queue.length > 0 ? this.queue[0].timestamp : null;
    
    return {
      pending: this.queue.length,
      processing: this.isProcessing,
      oldestRequest,
    };
  }

  clearQueue(): void {
    this.queue = [];
    logger.info('Offline request queue cleared');
  }
}

export default NetworkManager;
