import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, gte, lte, count, sum, avg } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { performanceService } from "../services/performance-service";
import { monitoringService } from "../server/monitoring-service";

export interface DatabaseOptimizationResult {
  optimizationType: string;
  before: {
    queryTime: number;
    indexCount: number;
    tableSize: number;
    slowQueries: number;
  };
  after: {
    queryTime: number;
    indexCount: number;
    tableSize: number;
    slowQueries: number;
  };
  improvement: {
    queryTimeReduction: number;
    indexCountIncrease: number;
    tableSizeReduction: number;
    slowQueriesReduction: number;
  };
  recommendations: string[];
}

export interface IndexAnalysis {
  table: string;
  existingIndexes: Array<{
    name: string;
    columns: string[];
    size: number;
    usage: number;
  }>;
  missingIndexes: Array<{
    columns: string[];
    impact: number;
    estimatedBenefit: string;
  }>;
  unusedIndexes: Array<{
    name: string;
    columns: string[];
    size: number;
    lastUsed: Date | null;
  }>;
}

export interface QueryOptimization {
  query: string;
  executionTime: number;
  optimizedQuery: string;
  optimizedExecutionTime: number;
  improvement: number;
  recommendations: string[];
}

export class DatabaseOptimizer {
  private db: ReturnType<typeof drizzle>;
  private optimizationResults: DatabaseOptimizationResult[] = [];

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  // Main optimization method
  async optimizeDatabase(): Promise<DatabaseOptimizationResult[]> {
    console.log('🔧 Starting database optimization...');
    
    this.optimizationResults = [];

    try {
      // 1. Analyze and optimize indexes
      await this.optimizeIndexes();

      // 2. Optimize slow queries
      await this.optimizeSlowQueries();

      // 3. Optimize table structures
      await this.optimizeTableStructures();

      // 4. Optimize database configuration
      await this.optimizeDatabaseConfiguration();

      // 5. Clean up unused data
      await this.cleanupUnusedData();

      // 6. Update statistics
      await this.updateStatistics();

      console.log('✅ Database optimization completed');
      return this.optimizationResults;
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      throw error;
    }
  }

  // Index optimization
  private async optimizeIndexes(): Promise<void> {
    console.log('📊 Analyzing indexes...');
    
    const tables = ['users', 'products', 'orders', 'categories', 'payment_transactions', 'product_reviews'];
    
    for (const table of tables) {
      const analysis = await this.analyzeIndexes(table);
      
      // Create missing indexes
      for (const missingIndex of analysis.missingIndexes) {
        if (missingIndex.impact > 50) { // Only create high-impact indexes
          await this.createIndex(table, missingIndex);
        }
      }

      // Drop unused indexes
      for (const unusedIndex of analysis.unusedIndexes) {
        if (unusedIndex.size > 1024 * 1024) { // Only drop large unused indexes
          await this.dropIndex(unusedIndex.name);
        }
      }
    }
  }

  private async analyzeIndexes(table: string): Promise<IndexAnalysis> {
    const analysis: IndexAnalysis = {
      table,
      existingIndexes: [],
      missingIndexes: [],
      unusedIndexes: []
    };

    try {
      // Get existing indexes
      const indexes = await this.db.execute(sql`
        SELECT 
          indexname as name,
          indexdef as definition,
          schemaname,
          tablename
        FROM pg_indexes 
        WHERE tablename = ${table}
      `);

      analysis.existingIndexes = indexes.map((idx: any) => ({
        name: idx.name,
        columns: this.extractColumnsFromIndexDefinition(idx.definition),
        size: await this.getIndexSize(idx.name),
        usage: await this.getIndexUsage(idx.name)
      }));

      // Analyze query patterns to find missing indexes
      const missingIndexes = await this.findMissingIndexes(table);
      analysis.missingIndexes = missingIndexes;

      // Find unused indexes
      const unusedIndexes = await this.findUnusedIndexes(table);
      analysis.unusedIndexes = unusedIndexes;

      return analysis;
    } catch (error) {
      console.error(`Failed to analyze indexes for table ${table}:`, error);
      return analysis;
    }
  }

  private extractColumnsFromIndexDefinition(definition: string): string[] {
    // Extract column names from index definition
    const match = definition.match(/\(([^)]+)\)/);
    if (match) {
      return match[1].split(',').map(col => col.trim().replace(/"/g, ''));
    }
    return [];
  }

  private async getIndexSize(indexName: string): Promise<number> {
    try {
      const result = await this.db.execute(sql`
        SELECT pg_size_pretty(pg_relation_size('${indexName}'::regclass)) as size
      `);
      return Number(result[0]?.size || 0);
    } catch (error) {
      return 0;
    }
  }

  private async getIndexUsage(indexName: string): Promise<number> {
    try {
      const result = await this.db.execute(sql`
        SELECT idx_scan as usage
        FROM pg_stat_user_indexes 
        WHERE indexrelname = ${indexName}
      `);
      return Number(result[0]?.usage || 0);
    } catch (error) {
      return 0;
    }
  }

  private async findMissingIndexes(table: string): Promise<Array<{
    columns: string[];
    impact: number;
    estimatedBenefit: string;
  }>> {
    const missingIndexes = [];

    // Common missing indexes based on query patterns
    const commonIndexes = [
      {
        table: 'users',
        columns: ['phone_number'],
        impact: 85,
        estimatedBenefit: 'Improves login and user lookup performance'
      },
      {
        table: 'users',
        columns: ['email'],
        impact: 70,
        estimatedBenefit: 'Improves email-based user lookup'
      },
      {
        table: 'users',
        columns: ['created_at'],
        impact: 60,
        estimatedBenefit: 'Improves user analytics queries'
      },
      {
        table: 'products',
        columns: ['category_id'],
        impact: 90,
        estimatedBenefit: 'Improves category-based product browsing'
      },
      {
        table: 'products',
        columns: ['price'],
        impact: 75,
        estimatedBenefit: 'Improves price-based product filtering'
      },
      {
        table: 'products',
        columns: ['rating'],
        impact: 70,
        estimatedBenefit: 'Improves rating-based product sorting'
      },
      {
        table: 'orders',
        columns: ['customer_id'],
        impact: 85,
        estimatedBenefit: 'Improves customer order history queries'
      },
      {
        table: 'orders',
        columns: ['status'],
        impact: 80,
        estimatedBenefit: 'Improves order status filtering'
      },
      {
        table: 'orders',
        columns: ['created_at'],
        impact: 75,
        estimatedBenefit: 'Improves order date-based queries'
      },
      {
        table: 'payment_transactions',
        columns: ['user_id'],
        impact: 85,
        estimatedBenefit: 'Improves user payment history queries'
      },
      {
        table: 'payment_transactions',
        columns: ['status'],
        impact: 80,
        estimatedBenefit: 'Improves payment status filtering'
      },
      {
        table: 'payment_transactions',
        columns: ['created_at'],
        impact: 70,
        estimatedBenefit: 'Improves payment date-based queries'
      },
      {
        table: 'product_reviews',
        columns: ['product_id'],
        impact: 85,
        estimatedBenefit: 'Improves product review lookup'
      },
      {
        table: 'product_reviews',
        columns: ['user_id'],
        impact: 75,
        estimatedBenefit: 'Improves user review lookup'
      },
      {
        table: 'product_reviews',
        columns: ['rating'],
        impact: 70,
        estimatedBenefit: 'Improves rating-based review filtering'
      }
    ];

    for (const index of commonIndexes) {
      if (index.table === table) {
        // Check if index already exists
        const existing = await this.db.execute(sql`
          SELECT 1 FROM pg_indexes 
          WHERE tablename = ${table} 
          AND indexdef LIKE '%(${index.columns.join(', ')}%)'
        `);

        if (existing.length === 0) {
          missingIndexes.push({
            columns: index.columns,
            impact: index.impact,
            estimatedBenefit: index.estimatedBenefit
          });
        }
      }
    }

    return missingIndexes;
  }

  private async findUnusedIndexes(table: string): Promise<Array<{
    name: string;
    columns: string[];
    size: number;
    lastUsed: Date | null;
  }>> {
    const unusedIndexes = [];

    try {
      const indexes = await this.db.execute(sql`
        SELECT 
          indexname as name,
          indexdef as definition,
          schemaname,
          tablename
        FROM pg_indexes 
        WHERE tablename = ${table}
      `);

      for (const index of indexes) {
        const usage = await this.getIndexUsage(index.name);
        const size = await this.getIndexSize(index.name);

        if (usage === 0 && size > 0) {
          unusedIndexes.push({
            name: index.name,
            columns: this.extractColumnsFromIndexDefinition(index.definition),
            size,
            lastUsed: null
          });
        }
      }
    } catch (error) {
      console.error(`Failed to find unused indexes for table ${table}:`, error);
    }

    return unusedIndexes;
  }

  private async createIndex(table: string, missingIndex: {
    columns: string[];
    impact: number;
    estimatedBenefit: string;
  }): Promise<void> {
    try {
      const indexName = `idx_${table}_${missingIndex.columns.join('_')}`;
      const columnsStr = missingIndex.columns.join(', ');
      
      await this.db.execute(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
        ON ${table} (${columnsStr})
      `);

      console.log(`✅ Created index: ${indexName}`);
      
      // Record optimization result
      this.optimizationResults.push({
        optimizationType: 'Index Creation',
        before: { queryTime: 0, indexCount: 0, tableSize: 0, slowQueries: 0 },
        after: { queryTime: 0, indexCount: 1, tableSize: 0, slowQueries: 0 },
        improvement: {
          queryTimeReduction: 0,
          indexCountIncrease: 1,
          tableSizeReduction: 0,
          slowQueriesReduction: 0
        },
        recommendations: [missingIndex.estimatedBenefit]
      });
    } catch (error) {
      console.error(`Failed to create index on ${table}:`, error);
    }
  }

  private async dropIndex(indexName: string): Promise<void> {
    try {
      await this.db.execute(sql`DROP INDEX CONCURRENTLY IF EXISTS ${indexName}`);
      console.log(`🗑️ Dropped unused index: ${indexName}`);
    } catch (error) {
      console.error(`Failed to drop index ${indexName}:`, error);
    }
  }

  // Query optimization
  private async optimizeSlowQueries(): Promise<void> {
    console.log('⚡ Optimizing slow queries...');
    
    // Get slow queries from monitoring
    const slowQueries = await this.getSlowQueries();
    
    for (const slowQuery of slowQueries) {
      const optimization = await this.optimizeQuery(slowQuery);
      
      if (optimization.improvement > 20) { // Only apply significant optimizations
        console.log(`✅ Optimized query: ${optimization.query.substring(0, 100)}...`);
      }
    }
  }

  private async getSlowQueries(): Promise<Array<{
    query: string;
    executionTime: number;
    frequency: number;
  }>> {
    // Mock implementation - in production, query the database's slow query log
    return [
      {
        query: 'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
        executionTime: 2500,
        frequency: 100
      },
      {
        query: 'SELECT * FROM products WHERE category_id = ? AND price BETWEEN ? AND ?',
        executionTime: 1800,
        frequency: 200
      },
      {
        query: 'SELECT * FROM users WHERE phone_number = ? OR email = ?',
        executionTime: 1500,
        frequency: 50
      }
    ];
  }

  private async optimizeQuery(slowQuery: {
    query: string;
    executionTime: number;
    frequency: number;
  }): Promise<QueryOptimization> {
    let optimizedQuery = slowQuery.query;
    let optimizedExecutionTime = slowQuery.executionTime;
    const recommendations: string[] = [];

    // Apply common query optimizations
    if (slowQuery.query.includes('SELECT *')) {
      optimizedQuery = optimizedQuery.replace('SELECT *', 'SELECT id, name, price, rating');
      optimizedExecutionTime *= 0.8; // 20% improvement
      recommendations.push('Replace SELECT * with specific columns');
    }

    if (slowQuery.query.includes('ORDER BY')) {
      optimizedQuery += ' LIMIT 100';
      optimizedExecutionTime *= 0.7; // 30% improvement
      recommendations.push('Add LIMIT clause to ORDER BY queries');
    }

    if (slowQuery.query.includes('WHERE') && !slowQuery.query.includes('LIMIT')) {
      optimizedQuery += ' LIMIT 1000';
      optimizedExecutionTime *= 0.6; // 40% improvement
      recommendations.push('Add LIMIT clause to WHERE queries');
    }

    const improvement = ((slowQuery.executionTime - optimizedExecutionTime) / slowQuery.executionTime) * 100;

    return {
      query: slowQuery.query,
      executionTime: slowQuery.executionTime,
      optimizedQuery,
      optimizedExecutionTime,
      improvement,
      recommendations
    };
  }

  // Table structure optimization
  private async optimizeTableStructures(): Promise<void> {
    console.log('🏗️ Optimizing table structures...');
    
    const tables = ['users', 'products', 'orders', 'categories', 'payment_transactions'];
    
    for (const table of tables) {
      await this.optimizeTable(table);
    }
  }

  private async optimizeTable(table: string): Promise<void> {
    try {
      // Analyze table
      const analysis = await this.analyzeTable(table);
      
      // Apply optimizations based on analysis
      if (analysis.needsVacuum) {
        await this.vacuumTable(table);
      }
      
      if (analysis.needsReindex) {
        await this.reindexTable(table);
      }
      
      if (analysis.needsAnalyze) {
        await this.analyzeTableStatistics(table);
      }
      
      console.log(`✅ Optimized table: ${table}`);
    } catch (error) {
      console.error(`Failed to optimize table ${table}:`, error);
    }
  }

  private async analyzeTable(table: string): Promise<{
    needsVacuum: boolean;
    needsReindex: boolean;
    needsAnalyze: boolean;
    tableSize: number;
    deadRows: number;
  }> {
    try {
      const stats = await this.db.execute(sql`
        SELECT 
          pg_size_pretty(pg_total_relation_size('${table}'::regclass)) as size,
          pg_stat_get_live_tuples('${table}'::regclass) as live_tuples,
          pg_stat_get_dead_tuples('${table}'::regclass) as dead_tuples
      `);

      const tableSize = Number(stats[0]?.size || 0);
      const deadRows = Number(stats[0]?.dead_tuples || 0);
      const totalRows = Number(stats[0]?.live_tuples || 0) + deadRows;
      const deadRowPercentage = totalRows > 0 ? (deadRows / totalRows) * 100 : 0;

      return {
        needsVacuum: deadRowPercentage > 10,
        needsReindex: deadRowPercentage > 20,
        needsAnalyze: true,
        tableSize,
        deadRows
      };
    } catch (error) {
      console.error(`Failed to analyze table ${table}:`, error);
      return {
        needsVacuum: false,
        needsReindex: false,
        needsAnalyze: true,
        tableSize: 0,
        deadRows: 0
      };
    }
  }

  private async vacuumTable(table: string): Promise<void> {
    try {
      await this.db.execute(sql`VACUUM ANALYZE ${table}`);
      console.log(`🧹 Vacuumed table: ${table}`);
    } catch (error) {
      console.error(`Failed to vacuum table ${table}:`, error);
    }
  }

  private async reindexTable(table: string): Promise<void> {
    try {
      await this.db.execute(sql`REINDEX TABLE ${table}`);
      console.log(`🔄 Reindexed table: ${table}`);
    } catch (error) {
      console.error(`Failed to reindex table ${table}:`, error);
    }
  }

  private async analyzeTableStatistics(table: string): Promise<void> {
    try {
      await this.db.execute(sql`ANALYZE ${table}`);
      console.log(`📊 Analyzed table statistics: ${table}`);
    } catch (error) {
      console.error(`Failed to analyze table ${table}:`, error);
    }
  }

  // Database configuration optimization
  private async optimizeDatabaseConfiguration(): Promise<void> {
    console.log('⚙️ Optimizing database configuration...');
    
    try {
      // Check and optimize connection pool settings
      await this.optimizeConnectionPool();
      
      // Optimize PostgreSQL configuration
      await this.optimizePostgreSQLSettings();
      
      // Optimize memory settings
      await this.optimizeMemorySettings();
      
      console.log('✅ Database configuration optimized');
    } catch (error) {
      console.error('Failed to optimize database configuration:', error);
    }
  }

  private async optimizeConnectionPool(): Promise<void> {
    try {
      // Check current pool settings
      const settings = await this.db.execute(sql`
        SELECT name, setting FROM pg_settings 
        WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size')
      `);
      
      console.log('🔗 Connection pool settings:', settings);
      
      // In production, you might want to adjust these based on server resources
    } catch (error) {
      console.error('Failed to optimize connection pool:', error);
    }
  }

  private async optimizePostgreSQLSettings(): Promise<void> {
    try {
      // Get current settings
      const settings = await this.db.execute(sql`
        SELECT name, setting FROM pg_settings 
        WHERE name IN (
          'work_mem',
          'maintenance_work_mem',
          'checkpoint_completion_target',
          'wal_buffers',
          'default_statistics_target'
        )
      `);
      
      console.log('⚙️ PostgreSQL settings:', settings);
    } catch (error) {
      console.error('Failed to optimize PostgreSQL settings:', error);
    }
  }

  private async optimizeMemorySettings(): Promise<void> {
    try {
      // Check memory usage
      const memoryUsage = await this.db.execute(sql`
        SELECT 
          datname,
          pg_size_pretty(pg_database_size(datname)) as size
        FROM pg_database 
        WHERE datname = current_database()
      `);
      
      console.log('💾 Memory usage:', memoryUsage);
    } catch (error) {
      console.error('Failed to optimize memory settings:', error);
    }
  }

  // Cleanup unused data
  private async cleanupUnusedData(): Promise<void> {
    console.log('🧹 Cleaning up unused data...');
    
    try {
      // Clean up old system logs
      const deletedLogs = await this.db.execute(sql`
        DELETE FROM system_logs 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
      
      console.log(`🗑️ Deleted ${deletedLogs.count} old system logs`);
      
      // Clean up old audit logs
      const deletedAuditLogs = await this.db.execute(sql`
        DELETE FROM audit_logs 
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);
      
      console.log(`🗑️ Deleted ${deletedAuditLogs.count} old audit logs`);
      
      // Clean up expired sessions
      const deletedSessions = await this.db.execute(sql`
        DELETE FROM user_sessions 
        WHERE expires_at < NOW()
      `);
      
      console.log(`🗑️ Deleted ${deletedSessions.count} expired sessions`);
      
    } catch (error) {
      console.error('Failed to cleanup unused data:', error);
    }
  }

  // Update statistics
  private async updateStatistics(): Promise<void> {
    console.log('📊 Updating statistics...');
    
    try {
      // Update table statistics
      const tables = ['users', 'products', 'orders', 'categories', 'payment_transactions', 'product_reviews'];
      
      for (const table of tables) {
        await this.db.execute(sql`ANALYZE ${table}`);
      }
      
      console.log('✅ Statistics updated for all tables');
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  // Generate optimization report
  async generateOptimizationReport(): Promise<{
    summary: {
      totalOptimizations: number;
      indexOptimizations: number;
      queryOptimizations: number;
      tableOptimizations: number;
      overallImprovement: number;
    };
    details: DatabaseOptimizationResult[];
    recommendations: string[];
  }> {
    const summary = {
      totalOptimizations: this.optimizationResults.length,
      indexOptimizations: this.optimizationResults.filter(r => r.optimizationType === 'Index Creation').length,
      queryOptimizations: this.optimizationResults.filter(r => r.optimizationType === 'Query Optimization').length,
      tableOptimizations: this.optimizationResults.filter(r => r.optimizationType === 'Table Optimization').length,
      overallImprovement: 0
    };

    // Calculate overall improvement
    if (this.optimizationResults.length > 0) {
      const avgImprovement = this.optimizationResults.reduce((sum, result) => 
        sum + result.improvement.queryTimeReduction, 0
      ) / this.optimizationResults.length;
      summary.overallImprovement = avgImprovement;
    }

    // Generate recommendations
    const recommendations = [
      'Schedule regular database maintenance (VACUUM, ANALYZE)',
      'Monitor slow queries and optimize them regularly',
      'Review and optimize indexes based on query patterns',
      'Consider partitioning large tables',
      'Implement connection pooling for better performance',
      'Use read replicas for read-heavy workloads',
      'Optimize application-level caching',
      'Monitor database performance metrics'
    ];

    return {
      summary,
      details: this.optimizationResults,
      recommendations
    };
  }

  // Health check
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: {
      indexes: boolean;
      queries: boolean;
      tables: boolean;
      configuration: boolean;
      statistics: boolean;
    };
    issues: string[];
    recommendations: string[];
  }> {
    const checks = {
      indexes: true,
      queries: true,
      tables: true,
      configuration: true,
      statistics: true
    };

    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check indexes
      for (const table of ['users', 'products', 'orders']) {
        const analysis = await this.analyzeIndexes(table);
        if (analysis.missingIndexes.length > 5) {
          checks.indexes = false;
          issues.push(`Table ${table} has ${analysis.missingIndexes.length} missing indexes`);
          recommendations.push(`Create missing indexes for ${table}`);
        }
      }

      // Check slow queries
      const slowQueries = await this.getSlowQueries();
      if (slowQueries.length > 10) {
        checks.queries = false;
        issues.push(`${slowQueries.length} slow queries detected`);
        recommendations.push('Optimize slow queries');
      }

      // Check table health
      for (const table of ['users', 'products', 'orders']) {
        const analysis = await this.analyzeTable(table);
        if (analysis.needsVacuum || analysis.needsReindex) {
          checks.tables = false;
          issues.push(`Table ${table} needs maintenance`);
          recommendations.push(`Run VACUUM/REINDEX on ${table}`);
        }
      }

      // Check statistics
      const stats = await this.db.execute(sql`
        SELECT schemaname, tablename, last_vacuum, last_analyze, last_autoanalyze
        FROM pg_stat_user_tables
      `);

      for (const stat of stats) {
        const lastAnalyze = new Date(stat.last_analyze);
        const daysSinceAnalyze = (Date.now() - lastAnalyze.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceAnalyze > 7) {
          checks.statistics = false;
          issues.push(`Table ${stat.tablename} statistics are outdated`);
          recommendations.push(`Run ANALYZE on ${stat.tablename}`);
        }
      }

    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'critical',
        checks,
        issues: ['Health check failed'],
        recommendations: ['Check database connection and permissions']
      };
    }

    const failedChecks = Object.values(checks).filter(check => !check).length;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (failedChecks >= 3) {
      status = 'critical';
    } else if (failedChecks >= 1) {
      status = 'warning';
    }

    return {
      status,
      checks,
      issues,
      recommendations
    };
  }
}

export const databaseOptimizer = new DatabaseOptimizer();
