import { EventEmitter } from 'events';
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, gte, lte, count } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime: number;
  lastChecked: Date;
  details?: any;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
    size: number;
  };
  application: {
    uptime: number;
    requestsPerSecond: number;
    errorRate: number;
    responseTime: number;
  };
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  details?: any;
}

export interface MonitoringConfig {
  healthChecks: {
    interval: number;
    timeout: number;
    retries: number;
  };
  metrics: {
    interval: number;
    retention: number;
  };
  alerts: {
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
      responseTime: number;
      errorRate: number;
    };
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
}

export class MonitoringService extends EventEmitter {
  private static instance: MonitoringService;
  private db: ReturnType<typeof drizzle>;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private config: MonitoringConfig;
  private isRunning: boolean = false;

  private constructor() {
    super();
    this.config = this.getDefaultConfig();
    this.initializeDatabase();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      healthChecks: {
        interval: 30000, // 30 seconds
        timeout: 5000,    // 5 seconds
        retries: 3
      },
      metrics: {
        interval: 60000,  // 1 minute
        retention: 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      alerts: {
        thresholds: {
          cpu: 80,           // 80%
          memory: 85,        // 85%
          disk: 90,          // 90%
          responseTime: 1000, // 1 second
          errorRate: 5       // 5%
        }
      },
      notifications: {
        email: true,
        slack: false,
        webhook: false
      }
    };
  }

  private async initializeDatabase(): Promise<void> {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
      }
      
      const connectionString = process.env.DATABASE_URL;
      const client = postgres(connectionString);
      this.db = drizzle(client, { schema });
      
      console.log('✅ Monitoring service database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring database:', error);
    }
  }

  // Start monitoring
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoring is already running');
      return;
    }

    console.log('🚀 Starting monitoring service...');
    this.isRunning = true;

    // Start health checks
    this.startHealthChecks();

    // Start metrics collection
    this.startMetricsCollection();

    // Start alert processing
    this.startAlertProcessing();

    console.log('✅ Monitoring service started');
    this.emit('started');
  }

  // Stop monitoring
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Monitoring is not running');
      return;
    }

    console.log('🛑 Stopping monitoring service...');
    this.isRunning = false;

    console.log('✅ Monitoring service stopped');
    this.emit('stopped');
  }

  // Health checks
  private startHealthChecks(): void {
    const checkInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(checkInterval);
        return;
      }

      await this.runAllHealthChecks();
    }, this.config.healthChecks.interval);

    // Run initial health check
    this.runAllHealthChecks();
  }

  private async runAllHealthChecks(): Promise<void> {
    const checks = [
      'database',
      'api',
      'cache',
      'storage',
      'external-services'
    ];

    await Promise.allSettled(
      checks.map(check => this.runHealthCheck(check))
    );
  }

  private async runHealthCheck(name: string): Promise<void> {
    const startTime = Date.now();
    let healthCheck: HealthCheck;

    try {
      let result;
      
      switch (name) {
        case 'database':
          result = await this.checkDatabase();
          break;
        case 'api':
          result = await this.checkAPI();
          break;
        case 'cache':
          result = await this.checkCache();
          break;
        case 'storage':
          result = await this.checkStorage();
          break;
        case 'external-services':
          result = await this.checkExternalServices();
          break;
        default:
          throw new Error(`Unknown health check: ${name}`);
      }

      healthCheck = {
        name,
        status: result.status,
        message: result.message,
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: result.details
      };

      if (result.status === 'error') {
        this.createAlert({
          type: 'error',
          severity: 'high',
          title: `Health Check Failed: ${name}`,
          message: result.message,
          source: 'health-check',
          details: result.details
        });
      }
    } catch (error) {
      healthCheck = {
        name,
        status: 'error',
        message: `Health check failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: { error: error.message }
      };

      this.createAlert({
        type: 'error',
        severity: 'critical',
        title: `Health Check Error: ${name}`,
        message: `Health check threw an error: ${error.message}`,
        source: 'health-check',
        details: { error: error.message, stack: error.stack }
      });
    }

    this.healthChecks.set(name, healthCheck);
    this.emit('healthCheck', healthCheck);
  }

  private async checkDatabase(): Promise<{ status: 'healthy' | 'warning' | 'error'; message: string; details: any }> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await this.db.select({ count: sql`COUNT(*)` }).from(schema.users).limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 1000) {
        return {
          status: 'warning',
          message: `Database response time is slow: ${responseTime}ms`,
          details: { responseTime }
        };
      }

      return {
        status: 'healthy',
        message: 'Database is responding normally',
        details: { responseTime }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Database connection failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async checkAPI(): Promise<{ status: 'healthy' | 'warning' | 'error'; message: string; details: any }> {
    try {
      const startTime = Date.now();
      
      // Test API endpoint
      const response = await fetch('http://localhost:3001/health', {
        timeout: this.config.healthChecks.timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          status: 'error',
          message: `API returned status ${response.status}`,
          details: { status: response.status, responseTime }
        };
      }

      if (responseTime > 500) {
        return {
          status: 'warning',
          message: `API response time is slow: ${responseTime}ms`,
          details: { responseTime }
        };
      }

      return {
        status: 'healthy',
        message: 'API is responding normally',
        details: { responseTime }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `API health check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async checkCache(): Promise<{ status: 'healthy' | 'warning' | 'error'; message: string; details: any }> {
    try {
      // Simulate cache check
      const cacheHitRate = 0.85;
      
      if (cacheHitRate < 0.7) {
        return {
          status: 'warning',
          message: `Cache hit rate is low: ${(cacheHitRate * 100).toFixed(1)}%`,
          details: { hitRate: cacheHitRate }
        };
      }

      return {
        status: 'healthy',
        message: 'Cache is performing normally',
        details: { hitRate: cacheHitRate }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Cache check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async checkStorage(): Promise<{ status: 'healthy' | 'warning' | 'error'; message: string; details: any }> {
    try {
      // Simulate storage check
      const diskUsage = 0.65;
      
      if (diskUsage > 0.9) {
        return {
          status: 'error',
          message: `Disk usage is critical: ${(diskUsage * 100).toFixed(1)}%`,
          details: { usage: diskUsage }
        };
      }

      if (diskUsage > 0.8) {
        return {
          status: 'warning',
          message: `Disk usage is high: ${(diskUsage * 100).toFixed(1)}%`,
          details: { usage: diskUsage }
        };
      }

      return {
        status: 'healthy',
        message: 'Storage is normal',
        details: { usage: diskUsage }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Storage check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async checkExternalServices(): Promise<{ status: 'healthy' | 'warning' | 'error'; message: string; details: any }> {
    try {
      // Check external services (payment gateways, etc.)
      const services = ['stripe', 'paypal'];
      const results = [];

      for (const service of services) {
        // Simulate service check
        results.push({
          service,
          status: 'healthy',
          responseTime: Math.floor(Math.random() * 500)
        });
      }

      const failedServices = results.filter(r => r.status !== 'healthy');
      
      if (failedServices.length > 0) {
        return {
          status: 'error',
          message: `${failedServices.length} external services failed`,
          details: { results }
        };
      }

      return {
        status: 'healthy',
        message: 'All external services are healthy',
        details: { results }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `External services check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Metrics collection
  private startMetricsCollection(): void {
    const metricsInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(metricsInterval);
        return;
      }

      await this.collectMetrics();
    }, this.config.metrics.interval);

    // Collect initial metrics
    this.collectMetrics();
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.getSystemMetrics();
      
      this.metrics.push(metrics);
      
      // Keep only metrics within retention period
      const cutoffTime = Date.now() - this.config.metrics.retention;
      this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
      
      // Check thresholds and create alerts
      this.checkMetricThresholds(metrics);
      
      this.emit('metrics', metrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 100,
          loadAverage: [0.5, 0.3, 0.2] // Simulated
        },
        memory: {
          total: memUsage.heapTotal,
          used: memUsage.heapUsed,
          free: memUsage.heapTotal - memUsage.heapUsed,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        disk: {
          total: 100 * 1024 * 1024 * 1024, // 100GB
          used: 65 * 1024 * 1024 * 1024, // 65GB
          free: 35 * 1024 * 1024 * 1024, // 35GB
          percentage: 65
        },
        network: {
          bytesIn: Math.floor(Math.random() * 1000000),
          bytesOut: Math.floor(Math.random() * 1000000),
          packetsIn: Math.floor(Math.random() * 10000),
          packetsOut: Math.floor(Math.random() * 10000)
        },
        database: {
          connections: 5,
          queryTime: Math.floor(Math.random() * 500),
          cacheHitRate: 0.85,
          size: 500 * 1024 * 1024 // 500MB
        },
        application: {
          uptime: process.uptime(),
          requestsPerSecond: Math.floor(Math.random() * 100),
          errorRate: Math.random() * 5,
          responseTime: Math.floor(Math.random() * 500)
        }
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      throw error;
    }
  }

  private checkMetricThresholds(metrics: SystemMetrics): void {
    const thresholds = this.config.alerts.thresholds;

    // CPU threshold
    if (metrics.cpu.usage > thresholds.cpu) {
      this.createAlert({
        type: 'warning',
        severity: 'medium',
        title: 'High CPU Usage',
        message: `CPU usage is ${(metrics.cpu.usage * 100).toFixed(1)}%`,
        source: 'metrics',
        details: { cpu: metrics.cpu }
      });
    }

    // Memory threshold
    if (metrics.memory.percentage > thresholds.memory) {
      this.createAlert({
        type: 'warning',
        severity: 'high',
        title: 'High Memory Usage',
        message: `Memory usage is ${metrics.memory.percentage.toFixed(1)}%`,
        source: 'metrics',
        details: { memory: metrics.memory }
      });
    }

    // Disk threshold
    if (metrics.disk.percentage > thresholds.disk) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'High Disk Usage',
        message: `Disk usage is ${metrics.disk.percentage.toFixed(1)}%`,
        source: 'metrics',
        details: { disk: metrics.disk }
      });
    }

    // Response time threshold
    if (metrics.application.responseTime > thresholds.responseTime) {
      this.createAlert({
        type: 'warning',
        severity: 'medium',
        title: 'High Response Time',
        message: `Response time is ${metrics.application.responseTime}ms`,
        source: 'metrics',
        details: { responseTime: metrics.application.responseTime }
      });
    }

    // Error rate threshold
    if (metrics.application.errorRate > thresholds.errorRate) {
      this.createAlert({
        type: 'error',
        severity: 'high',
        title: 'High Error Rate',
        message: `Error rate is ${metrics.application.errorRate.toFixed(1)}%`,
        source: 'metrics',
        details: { errorRate: metrics.application.errorRate }
      });
    }
  }

  // Alert management
  private startAlertProcessing(): void {
    // Process alerts every minute
    setInterval(async () => {
      if (!this.isRunning) return;
      
      await this.processAlerts();
    }, 60000);
  }

  private async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: Alert = {
      ...alertData,
      id: this.generateId(),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Send notifications
    await this.sendNotification(alert);

    this.emit('alert', alert);
  }

  private async processAlerts(): Promise<void> {
    // Check for alert patterns and auto-resolve
    const recentAlerts = this.alerts.filter(a => 
      !a.resolved && 
      Date.now() - a.timestamp.getTime() < 300000 // Last 5 minutes
    );

    // Group alerts by type
    const alertGroups = recentAlerts.reduce((groups, alert) => {
      const key = `${alert.type}-${alert.source}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(alert);
      return groups;
    }, {} as Record<string, Alert[]>);

    // Auto-resolve temporary issues
    for (const [key, group] of Object.entries(alertGroups)) {
      if (group.length === 1 && group[0].severity === 'low') {
        // Auto-resolve low severity single alerts after 5 minutes
        this.resolveAlert(group[0].id);
      }
    }
  }

  private async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      this.emit('alertResolved', alert);
    }
  }

  private async sendNotification(alert: Alert): Promise<void> {
    try {
      if (!this.config.notifications.email) return;

      // Send email notification (simulated)
      console.log(`📧 Alert notification: ${alert.title} - ${alert.message}`);
      
      // In production, you'd use an email service
      // await emailService.sendAlert(alert);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Public API methods
  async getHealthStatus(): Promise<{ status: 'healthy' | 'warning' | 'error'; checks: HealthCheck[] }> {
    const checks = Array.from(this.healthChecks.values());
    
    if (checks.some(c => c.status === 'error')) {
      return { status: 'error', checks };
    }
    
    if (checks.some(c => c.status === 'warning')) {
      return { status: 'warning', checks };
    }
    
    return { status: 'healthy', checks };
  }

  async getMetrics(hours: number = 24): Promise<SystemMetrics[]> {
    const cutoffTime = Date.now() - (hours * 3600000);
    return this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  async getAlerts(limit = 100, resolved = false): Promise<Alert[]> {
    let alerts = this.alerts;
    
    if (!resolved) {
      alerts = alerts.filter(a => !a.resolved);
    }
    
    return alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getDashboard(): Promise<{
    health: { status: 'healthy' | 'warning' | 'error'; checks: HealthCheck[] };
    metrics: SystemMetrics;
    alerts: { total: number; recent: Alert[]; critical: Alert[] };
    uptime: number;
  }> {
    const health = await this.getHealthStatus();
    const latestMetrics = this.metrics[this.metrics.length - 1] || await this.getSystemMetrics();
    const recentAlerts = await this.getAlerts(10);
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical' && !a.resolved);

    return {
      health,
      metrics: latestMetrics,
      alerts: {
        total: this.alerts.length,
        recent: recentAlerts,
        critical: criticalAlerts
      },
      uptime: process.uptime()
    };
  }

  async runDiagnostics(): Promise<{
    healthChecks: HealthCheck[];
    systemMetrics: SystemMetrics;
    recentAlerts: Alert[];
    performance: {
      slowQueries: number;
      errorRate: number;
      responseTime: number;
    };
  }> {
    const healthChecks = Array.from(this.healthChecks.values());
    const systemMetrics = await this.getSystemMetrics();
    const recentAlerts = await this.getAlerts(50);

    return {
      healthChecks,
      systemMetrics,
      recentAlerts,
      performance: {
        slowQueries: 5, // Simulated
        errorRate: systemMetrics.application.errorRate,
        responseTime: systemMetrics.application.responseTime
      }
    };
  }

  // Utility methods
  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

export const monitoringService = MonitoringService.getInstance();
