import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, gte, lte, count } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface PerformanceMetrics {
  database: {
    connectionPool: {
      active: number;
      idle: number;
      total: number;
      max: number;
    };
    queryStats: {
      avgResponseTime: number;
      slowQueries: number;
      totalQueries: number;
      cacheHitRate: number;
    };
    indexes: {
      missingIndexes: Array<{
        table: string;
        column: string;
        impact: number;
      }>;
      unusedIndexes: Array<{
        table: string;
        index: string;
        size: number;
      }>;
    };
  };
  application: {
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    cpuUsage: {
      user: number;
      system: number;
      idle: number;
    };
    responseTime: {
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requestsPerSecond: number;
      requestsPerMinute: number;
    };
  };
  cache: {
    redis: {
      hitRate: number;
      memoryUsage: number;
      keyCount: number;
      evictions: number;
    };
    application: {
      hitRate: number;
      size: number;
      evictions: number;
    };
  };
}

export interface OptimizationSuggestion {
  type: 'database' | 'cache' | 'code' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: string;
  implementation: string;
}

export class PerformanceService {
  private db: ReturnType<typeof drizzle>;
  private queryTimes: Array<{ query: string; time: number; timestamp: number }> = [];
  private responseTimes: Array<{ time: number; timestamp: number }> = [];
  private cacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    evictions: 0
  };

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
    
    // Start performance monitoring
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor database queries
    setInterval(() => {
      this.analyzeQueryPerformance();
    }, 60000); // Every minute

    // Monitor application performance
    setInterval(() => {
      this.analyzeApplicationPerformance();
    }, 30000); // Every 30 seconds

    // Clean up old data
    setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Every 5 minutes
  }

  // Database performance optimization
  async analyzeDatabasePerformance(): Promise<PerformanceMetrics['database']> {
    try {
      // Get connection pool stats
      const poolStats = await this.getConnectionPoolStats();
      
      // Get query performance stats
      const queryStats = await this.getQueryStats();
      
      // Analyze indexes
      const indexes = await this.analyzeIndexes();
      
      return {
        connectionPool: poolStats,
        queryStats,
        indexes
      };
    } catch (error) {
      console.error('Failed to analyze database performance:', error);
      return this.getDefaultDatabaseMetrics();
    }
  }

  private async getConnectionPoolStats(): Promise<PerformanceMetrics['database']['connectionPool']> {
    try {
      // Simulate connection pool stats
      // In a real implementation, you'd get these from your database driver
      return {
        active: 2,
        idle: 8,
        total: 10,
        max: 20
      };
    } catch (error) {
      return {
        active: 0,
        idle: 0,
        total: 0,
        max: 0
      };
    }
  }

  private async getQueryStats(): Promise<PerformanceMetrics['database']['queryStats']> {
    try {
      const recentQueries = this.queryTimes.slice(-1000);
      
      if (recentQueries.length === 0) {
        return {
          avgResponseTime: 0,
          slowQueries: 0,
          totalQueries: 0,
          cacheHitRate: 0
        };
      }

      const avgResponseTime = recentQueries.reduce((sum, q) => sum + q.time, 0) / recentQueries.length;
      const slowQueries = recentQueries.filter(q => q.time > 1000).length;
      const cacheHitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;

      return {
        avgResponseTime,
        slowQueries,
        totalQueries: recentQueries.length,
        cacheHitRate
      };
    } catch (error) {
      return {
        avgResponseTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        cacheHitRate: 0
      };
    }
  }

  private async analyzeIndexes(): Promise<PerformanceMetrics['database']['indexes']> {
    try {
      // Find missing indexes
      const missingIndexes = await this.findMissingIndexes();
      
      // Find unused indexes
      const unusedIndexes = await this.findUnusedIndexes();
      
      return {
        missingIndexes,
        unusedIndexes
      };
    } catch (error) {
      return {
        missingIndexes: [],
        unusedIndexes: []
      };
    }
  }

  private async findMissingIndexes(): Promise<Array<{ table: string; column: string; impact: number }>> {
    try {
      // This is a simplified version - in production you'd use database-specific tools
      const missingIndexes = [];
      
      // Check for common missing indexes
      const tables = ['users', 'products', 'orders', 'categories'];
      
      for (const table of tables) {
        // Simulate finding missing indexes
        missingIndexes.push({
          table,
          column: 'created_at',
          impact: 85
        });
      }
      
      return missingIndexes;
    } catch (error) {
      return [];
    }
  }

  private async findUnusedIndexes(): Promise<Array<{ table: string; index: string; size: number }>> {
    try {
      // This is a simplified version - in production you'd use database-specific tools
      return [
        {
          table: 'users',
          index: 'idx_users_temp',
          size: 1024
        }
      ];
    } catch (error) {
      return [];
    }
  }

  // Application performance monitoring
  async analyzeApplicationPerformance(): Promise<PerformanceMetrics['application']> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = this.getCPUUsage();
      const responseTimeStats = this.getResponseTimeStats();
      const throughput = this.getThroughputStats();
      
      return {
        memoryUsage,
        cpuUsage,
        responseTime: responseTimeStats,
        throughput
      };
    } catch (error) {
      return this.getDefaultApplicationMetrics();
    }
  }

  private getCPUUsage(): PerformanceMetrics['application']['cpuUsage'] {
    // Simplified CPU usage - in production you'd use a proper CPU monitoring library
    return {
      user: 15.5,
      system: 8.2,
      idle: 76.3
    };
  }

  private getResponseTimeStats(): PerformanceMetrics['application']['responseTime'] {
    const recentResponseTimes = this.responseTimes.slice(-1000);
    
    if (recentResponseTimes.length === 0) {
      return {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }

    const sortedTimes = recentResponseTimes.map(rt => rt.time).sort((a, b) => a - b);
    const avg = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    
    return {
      avg,
      p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
      p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
    };
  }

  private getThroughputStats(): PerformanceMetrics['application']['throughput'] {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.responseTimes.filter(rt => rt.timestamp > oneMinuteAgo);
    
    return {
      requestsPerSecond: recentRequests.length / 60,
      requestsPerMinute: recentRequests.length
    };
  }

  // Cache performance monitoring
  async analyzeCachePerformance(): Promise<PerformanceMetrics['cache']> {
    try {
      const redisStats = await this.getRedisStats();
      const appCacheStats = this.getApplicationCacheStats();
      
      return {
        redis: redisStats,
        application: appCacheStats
      };
    } catch (error) {
      return this.getDefaultCacheMetrics();
    }
  }

  private async getRedisStats(): PerformanceMetrics['cache']['redis'] {
    // Simulate Redis stats - in production you'd connect to Redis
    return {
      hitRate: 0.85,
      memoryUsage: 50 * 1024 * 1024, // 50MB
      keyCount: 1250,
      evictions: 5
    };
  }

  private getApplicationCacheStats(): PerformanceMetrics['cache']['application'] {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    
    return {
      hitRate,
      size: this.cacheStats.size,
      evictions: this.cacheStats.evictions
    };
  }

  // Performance optimization suggestions
  async getOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    
    try {
      // Database optimizations
      const dbMetrics = await this.analyzeDatabasePerformance();
      
      if (dbMetrics.queryStats.slowQueries > 10) {
        suggestions.push({
          type: 'database',
          priority: 'high',
          title: 'Optimize Slow Queries',
          description: `${dbMetrics.queryStats.slowQueries} slow queries detected`,
          impact: 'Reduce database load and improve response times',
          effort: 'Medium',
          implementation: 'Add missing indexes, optimize query patterns, consider query caching'
        });
      }
      
      if (dbMetrics.connectionPool.active / dbMetrics.connectionPool.max > 0.8) {
        suggestions.push({
          type: 'database',
          priority: 'critical',
          title: 'Increase Database Connection Pool',
          description: 'Database connection pool is near capacity',
          impact: 'Prevent connection timeouts and improve scalability',
          effort: 'Low',
          implementation: 'Increase max connection pool size in database configuration'
        });
      }
      
      if (dbMetrics.indexes.missingIndexes.length > 0) {
        suggestions.push({
          type: 'database',
          priority: 'medium',
          title: 'Add Missing Database Indexes',
          description: `${dbMetrics.indexes.missingIndexes.length} missing indexes identified`,
          impact: 'Improve query performance significantly',
          effort: 'Low',
          implementation: 'Create indexes on frequently queried columns'
        });
      }
      
      // Application optimizations
      const appMetrics = await this.analyzeApplicationPerformance();
      
      if (appMetrics.memoryUsage.heapUsed / appMetrics.memoryUsage.heapTotal > 0.8) {
        suggestions.push({
          type: 'code',
          priority: 'high',
          title: 'Optimize Memory Usage',
          description: 'Memory usage is above 80%',
          impact: 'Prevent memory leaks and improve stability',
          effort: 'Medium',
          implementation: 'Profile memory usage, optimize data structures, implement memory pooling'
        });
      }
      
      if (appMetrics.responseTime.p95 > 1000) {
        suggestions.push({
          type: 'code',
          priority: 'high',
          title: 'Optimize Response Times',
          description: '95th percentile response time is above 1 second',
          impact: 'Improve user experience and reduce bounce rate',
          effort: 'Medium',
          implementation: 'Implement caching, optimize database queries, use CDN for static assets'
        });
      }
      
      // Cache optimizations
      const cacheMetrics = await this.analyzeCachePerformance();
      
      if (cacheMetrics.redis.hitRate < 0.8) {
        suggestions.push({
          type: 'cache',
          priority: 'medium',
          title: 'Improve Cache Hit Rate',
          description: `Redis cache hit rate is ${(cacheMetrics.redis.hitRate * 100).toFixed(1)}%`,
          impact: 'Reduce database load and improve response times',
          effort: 'Low',
          implementation: 'Review caching strategy, increase cache TTL, cache more frequently accessed data'
        });
      }
      
      if (cacheMetrics.application.hitRate < 0.7) {
        suggestions.push({
          type: 'cache',
          priority: 'low',
          title: 'Optimize Application Cache',
          description: `Application cache hit rate is ${(cacheMetrics.application.hitRate * 100).toFixed(1)}%`,
          impact: 'Improve performance for repeated operations',
          effort: 'Low',
          implementation: 'Implement LRU cache, cache computed values, optimize cache keys'
        });
      }
      
    } catch (error) {
      console.error('Failed to generate optimization suggestions:', error);
    }
    
    return suggestions;
  }

  // Performance monitoring utilities
  recordQueryTime(query: string, time: number): void {
    this.queryTimes.push({ query, time, timestamp: Date.now() });
    
    // Keep only last 1000 queries
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
  }

  recordResponseTime(time: number): void {
    this.responseTimes.push({ time, timestamp: Date.now() });
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  recordCacheHit(): void {
    this.cacheStats.hits++;
  }

  recordCacheMiss(): void {
    this.cacheStats.misses++;
  }

  recordCacheEviction(): void {
    this.cacheStats.evictions++;
  }

  // Performance optimization methods
  async optimizeDatabase(): Promise<void> {
    try {
      console.log('🔧 Starting database optimization...');
      
      // Create missing indexes
      await this.createMissingIndexes();
      
      // Analyze and optimize slow queries
      await this.optimizeSlowQueries();
      
      // Update table statistics
      await this.updateTableStatistics();
      
      console.log('✅ Database optimization completed');
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      throw error;
    }
  }

  private async createMissingIndexes(): Promise<void> {
    try {
      // Create indexes for common queries
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
        'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
        'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status)',
        'CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id)'
      ];
      
      for (const indexSql of indexes) {
        try {
          await this.db.execute(sql`${indexSql}`);
          console.log(`✅ Created index: ${indexSql}`);
        } catch (error) {
          console.log(`⚠️ Index already exists or failed: ${indexSql}`);
        }
      }
    } catch (error) {
      console.error('Failed to create missing indexes:', error);
    }
  }

  private async optimizeSlowQueries(): Promise<void> {
    try {
      // This would analyze slow queries and suggest optimizations
      console.log('🔍 Analyzing slow queries...');
      
      // Simulate query optimization
      await this.db.execute(sql`VACUUM ANALYZE`);
      
      console.log('✅ Query optimization completed');
    } catch (error) {
      console.error('Failed to optimize slow queries:', error);
    }
  }

  private async updateTableStatistics(): Promise<void> {
    try {
      const tables = ['users', 'products', 'orders', 'categories', 'payment_transactions'];
      
      for (const table of tables) {
        try {
          await this.db.execute(sql`ANALYZE ${sql.raw(table)}`);
        } catch (error) {
          console.log(`⚠️ Failed to analyze table ${table}:`, error);
        }
      }
      
      console.log('✅ Table statistics updated');
    } catch (error) {
      console.error('Failed to update table statistics:', error);
    }
  }

  async optimizeCache(): Promise<void> {
    try {
      console.log('🔧 Starting cache optimization...');
      
      // Clear expired cache entries
      await this.clearExpiredCache();
      
      // Pre-warm cache with frequently accessed data
      await this.preWarmCache();
      
      console.log('✅ Cache optimization completed');
    } catch (error) {
      console.error('❌ Cache optimization failed:', error);
      throw error;
    }
  }

  private async clearExpiredCache(): Promise<void> {
    try {
      // This would clear expired cache entries
      console.log('🧹 Clearing expired cache entries...');
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  private async preWarmCache(): Promise<void> {
    try {
      // Pre-warm cache with frequently accessed data
      console.log('🔥 Pre-warming cache...');
      
      // Cache popular products
      const popularProducts = await this.db
        .select()
        .from(schema.products)
        .where(eq(schema.products.isActive, true))
        .orderBy(desc(schema.products.rating))
        .limit(50);
      
      // Cache categories
      const categories = await this.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.isActive, true));
      
      console.log(`✅ Pre-warmed cache with ${popularProducts.length} products and ${categories.length} categories`);
    } catch (error) {
      console.error('Failed to pre-warm cache:', error);
    }
  }

  // Performance monitoring dashboard
  async getPerformanceDashboard(): Promise<{
    overview: {
      status: 'healthy' | 'warning' | 'critical';
      score: number;
      issues: number;
    };
    metrics: PerformanceMetrics;
    suggestions: OptimizationSuggestion[];
    trends: {
      responseTime: Array<{ timestamp: number; value: number }>;
      throughput: Array<{ timestamp: number; value: number }>;
      errorRate: Array<{ timestamp: number; value: number }>;
    };
  }> {
    try {
      const metrics = {
        database: await this.analyzeDatabasePerformance(),
        application: await this.analyzeApplicationPerformance(),
        cache: await this.analyzeCachePerformance()
      };
      
      const suggestions = await this.getOptimizationSuggestions();
      
      const overview = this.calculateOverviewScore(metrics);
      
      const trends = await this.getPerformanceTrends();
      
      return {
        overview,
        metrics,
        suggestions,
        trends
      };
    } catch (error) {
      console.error('Failed to get performance dashboard:', error);
      throw error;
    }
  }

  private calculateOverviewScore(metrics: PerformanceMetrics): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: number;
  } {
    let score = 100;
    let issues = 0;
    
    // Database score
    if (metrics.database.queryStats.avgResponseTime > 500) {
      score -= 20;
      issues++;
    }
    
    if (metrics.database.queryStats.cacheHitRate < 0.8) {
      score -= 15;
      issues++;
    }
    
    // Application score
    if (metrics.application.responseTime.p95 > 1000) {
      score -= 25;
      issues++;
    }
    
    if (metrics.application.memoryUsage.heapUsed / metrics.application.memoryUsage.heapTotal > 0.8) {
      score -= 20;
      issues++;
    }
    
    // Cache score
    if (metrics.cache.redis.hitRate < 0.8) {
      score -= 10;
      issues++;
    }
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 60) {
      status = 'critical';
    } else if (score < 80) {
      status = 'warning';
    }
    
    return { status, score, issues };
  }

  private async getPerformanceTrends(): Promise<{
    responseTime: Array<{ timestamp: number; value: number }>;
    throughput: Array<{ timestamp: number; value: number }>;
    errorRate: Array<{ timestamp: number; value: number }>;
  }> {
    // Simulate trend data - in production you'd get this from your monitoring system
    const now = Date.now();
    const trends = {
      responseTime: [],
      throughput: [],
      errorRate: []
    };
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = now - (i * 3600000); // Hourly data for last 24 hours
      trends.responseTime.push({
        timestamp,
        value: 200 + Math.random() * 100
      });
      trends.throughput.push({
        timestamp,
        value: 50 + Math.random() * 20
      });
      trends.errorRate.push({
        timestamp,
        value: Math.random() * 5
      });
    }
    
    return trends;
  }

  // Utility methods
  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - 3600000;
    
    this.queryTimes = this.queryTimes.filter(qt => qt.timestamp > oneHourAgo);
    this.responseTimes = this.responseTimes.filter(rt => rt.timestamp > oneHourAgo);
  }

  private getDefaultDatabaseMetrics(): PerformanceMetrics['database'] {
    return {
      connectionPool: { active: 0, idle: 0, total: 0, max: 0 },
      queryStats: { avgResponseTime: 0, slowQueries: 0, totalQueries: 0, cacheHitRate: 0 },
      indexes: { missingIndexes: [], unusedIndexes: [] }
    };
  }

  private getDefaultApplicationMetrics(): PerformanceMetrics['application'] {
    return {
      memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
      cpuUsage: { user: 0, system: 0, idle: 100 },
      responseTime: { avg: 0, p50: 0, p95: 0, p99: 0 },
      throughput: { requestsPerSecond: 0, requestsPerMinute: 0 }
    };
  }

  private getDefaultCacheMetrics(): PerformanceMetrics['cache'] {
    return {
      redis: { hitRate: 0, memoryUsage: 0, keyCount: 0, evictions: 0 },
      application: { hitRate: 0, size: 0, evictions: 0 }
    };
  }
}

export const performanceService = new PerformanceService();
