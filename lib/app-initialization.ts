import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './data-security';
import React, { useState, useEffect, useCallback } from 'react';

interface InitializationTask {
  id: string;
  name: string;
  priority: number;
  execute: () => Promise<void>;
  timeout?: number;
  required?: boolean;
}

interface InitializationResult {
  success: boolean;
  error?: string;
  duration: number;
}

interface AppInitializationState {
  isInitialized: boolean;
  isLoading: boolean;
  progress: number;
  currentTask: string;
  completedTasks: string[];
  failedTasks: string[];
  errors: string[];
}

class AppInitializationService {
  private static instance: AppInitializationService;
  private tasks: InitializationTask[] = [];
  private state: AppInitializationState = {
    isInitialized: false,
    isLoading: false,
    progress: 0,
    currentTask: '',
    completedTasks: [],
    failedTasks: [],
    errors: [],
  };
  private listeners: ((state: AppInitializationState) => void)[] = [];

  static getInstance(): AppInitializationService {
    if (!AppInitializationService.instance) {
      AppInitializationService.instance = new AppInitializationService();
    }
    return AppInitializationService.instance;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private updateState(updates: Partial<AppInitializationState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  addTask(task: Omit<InitializationTask, 'id'>): void {
    const taskWithId: InitializationTask = {
      ...task,
      id: this.generateTaskId(),
    };
    this.tasks.push(taskWithId);
    this.tasks.sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async executeTask(task: InitializationTask): Promise<InitializationResult> {
    const startTime = Date.now();
    
    try {
      this.updateState({ currentTask: task.name });
      
      const timeoutMs = task.timeout || 10000; // Default 10 seconds timeout
      
      await Promise.race([
        task.execute(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Task timeout')), timeoutMs)
        ),
      ]);

      const duration = Date.now() - startTime;
      
      this.updateState({
        completedTasks: [...this.state.completedTasks, task.id],
        progress: (this.state.completedTasks.length + 1) / this.tasks.length * 100,
      });

      logger.info(`Initialization task completed: ${task.name}`, { duration });

      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateState({
        failedTasks: [...this.state.failedTasks, task.id],
        errors: [...this.state.errors, `${task.name}: ${errorMessage}`],
      });

      logger.error(`Initialization task failed: ${task.name}`, { error, duration });

      if (task.required) {
        throw error;
      }

      return { success: false, error: errorMessage, duration };
    }
  }

  async initialize(): Promise<void> {
    if (this.state.isLoading) {
      throw new Error('Initialization already in progress');
    }

    if (this.state.isInitialized) {
      return;
    }

    this.updateState({
      isLoading: true,
      progress: 0,
      currentTask: '',
      completedTasks: [],
      failedTasks: [],
      errors: [],
    });

    try {
      logger.info('Starting app initialization', { taskCount: this.tasks.length });

      for (const task of this.tasks) {
        await this.executeTask(task);
      }

      this.updateState({
        isInitialized: true,
        isLoading: false,
        progress: 100,
        currentTask: '',
      });

      logger.info('App initialization completed', {
        completedTasks: this.state.completedTasks.length,
        failedTasks: this.state.failedTasks.length,
        errors: this.state.errors.length,
      });

    } catch (error) {
      this.updateState({
        isLoading: false,
        currentTask: '',
      });

      logger.error('App initialization failed', error);
      throw error;
    }
  }

  async initializeEssentialOnly(): Promise<void> {
    const essentialTasks = this.tasks.filter(task => task.required);
    
    if (essentialTasks.length === 0) {
      this.updateState({ isInitialized: true });
      return;
    }

    this.updateState({
      isLoading: true,
      progress: 0,
      currentTask: '',
      completedTasks: [],
      failedTasks: [],
      errors: [],
    });

    try {
      for (const task of essentialTasks) {
        await this.executeTask(task);
      }

      this.updateState({
        isInitialized: true,
        isLoading: false,
        progress: 100,
        currentTask: '',
      });

      logger.info('Essential app initialization completed');

    } catch (error) {
      this.updateState({
        isLoading: false,
        currentTask: '',
      });

      logger.error('Essential app initialization failed', error);
      throw error;
    }
  }

  getState(): AppInitializationState {
    return { ...this.state };
  }

  subscribe(listener: (state: AppInitializationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  reset(): void {
    this.state = {
      isInitialized: false,
      isLoading: false,
      progress: 0,
      currentTask: '',
      completedTasks: [],
      failedTasks: [],
      errors: [],
    };
    this.tasks = [];
    this.listeners = [];
  }
}

// Predefined initialization tasks
export const createInitializationTasks = (): Omit<InitializationTask, 'id'>[] => {
  return [
    {
      name: 'Load persisted data',
      priority: 100,
      required: true,
      timeout: 5000,
      execute: async () => {
        // Load user data
        const userData = await AsyncStorage.getItem('@freshmart_user');
        if (userData) {
          logger.info('User data loaded from storage');
        }

        // Load cart data
        const cartData = await AsyncStorage.getItem('@freshmart_cart');
        if (cartData) {
          logger.info('Cart data loaded from storage');
        }

        // Load app preferences
        const preferences = await AsyncStorage.getItem('@freshmart_preferences');
        if (preferences) {
          logger.info('App preferences loaded from storage');
        }
      },
    },
    {
      name: 'Initialize theme',
      priority: 90,
      required: true,
      timeout: 2000,
      execute: async () => {
        // Theme initialization would go here
        logger.info('Theme initialized');
      },
    },
    {
      name: 'Setup error handling',
      priority: 80,
      required: true,
      timeout: 3000,
      execute: async () => {
        // Error handling setup would go here
        logger.info('Error handling setup completed');
      },
    },
    {
      name: 'Initialize sync service',
      priority: 70,
      required: false,
      timeout: 4000,
      execute: async () => {
        // Sync service initialization would go here
        logger.info('Sync service initialized');
      },
    },
    {
      name: 'Preload critical data',
      priority: 60,
      required: false,
      timeout: 8000,
      execute: async () => {
        // Preload critical data like categories, user info
        logger.info('Critical data preloaded');
      },
    },
    {
      name: 'Initialize analytics',
      priority: 50,
      required: false,
      timeout: 3000,
      execute: async () => {
        // Analytics initialization would go here
        logger.info('Analytics initialized');
      },
    },
    {
      name: 'Warm up caches',
      priority: 40,
      required: false,
      timeout: 6000,
      execute: async () => {
        // Cache warming would go here
        logger.info('Caches warmed up');
      },
    },
    {
      name: 'Setup background tasks',
      priority: 30,
      required: false,
      timeout: 4000,
      execute: async () => {
        // Background task setup would go here
        logger.info('Background tasks setup completed');
      },
    },
    {
      name: 'Load optional features',
      priority: 20,
      required: false,
      timeout: 5000,
      execute: async () => {
        // Optional features loading would go here
        logger.info('Optional features loaded');
      },
    },
    {
      name: 'Final optimizations',
      priority: 10,
      required: false,
      timeout: 3000,
      execute: async () => {
        // Final optimizations would go here
        logger.info('Final optimizations completed');
      },
    },
  ];
};

// React Hook for app initialization
export function useAppInitialization() {
  const initService = AppInitializationService.getInstance();
  const [state, setState] = useState<AppInitializationState>(initService.getState());

  useEffect(() => {
    const unsubscribe = initService.subscribe(setState);
    return unsubscribe;
  }, [initService]);

  const initialize = useCallback(async () => {
    return initService.initialize();
  }, [initService]);

  const initializeEssentialOnly = useCallback(async () => {
    return initService.initializeEssentialOnly();
  }, [initService]);

  const reset = useCallback(() => {
    initService.reset();
  }, [initService]);

  return {
    ...state,
    initialize,
    initializeEssentialOnly,
    reset,
  };
}

// Performance monitoring for initialization
export class InitializationPerformanceMonitor {
  private static instance: InitializationPerformanceMonitor;
  private metrics: {
    totalTime: number;
    taskTimes: Record<string, number>;
    taskCounts: Record<string, number>;
    errors: string[];
  } = {
    totalTime: 0,
    taskTimes: {},
    taskCounts: {},
    errors: [],
  };

  static getInstance(): InitializationPerformanceMonitor {
    if (!InitializationPerformanceMonitor.instance) {
      InitializationPerformanceMonitor.instance = new InitializationPerformanceMonitor();
    }
    return InitializationPerformanceMonitor.instance;
  }

  recordTaskStart(taskName: string): void {
    this.metrics.taskCounts[taskName] = (this.metrics.taskCounts[taskName] || 0) + 1;
  }

  recordTaskEnd(taskName: string, duration: number): void {
    this.metrics.taskTimes[taskName] = duration;
    this.metrics.totalTime += duration;
  }

  recordError(error: string): void {
    this.metrics.errors.push(error);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getAverageTaskTime(taskName: string): number {
    const count = this.metrics.taskCounts[taskName];
    const totalTime = this.metrics.taskTimes[taskName];
    return count > 0 ? totalTime / count : 0;
  }

  generateReport(): string {
    const report = [
      'Initialization Performance Report',
      '================================',
      `Total Time: ${this.metrics.totalTime}ms`,
      `Total Tasks: ${Object.keys(this.metrics.taskCounts).length}`,
      `Errors: ${this.metrics.errors.length}`,
      '',
      'Task Performance:',
      ...Object.entries(this.metrics.taskTimes).map(([task, time]) => {
        const count = this.metrics.taskCounts[task];
        const avg = this.getAverageTaskTime(task);
        return `  ${task}: ${time}ms (avg: ${avg.toFixed(2)}ms, count: ${count})`;
      }),
      '',
      'Errors:',
      ...this.metrics.errors.map(error => `  - ${error}`),
    ];

    return report.join('\n');
  }
}

export default AppInitializationService;
