import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, isNull, sql, count, gte, lte } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface ConsistencyIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  table: string;
  count?: number;
  details?: any;
  fix?: string;
}

export class ConsistencyService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async runAllChecks(): Promise<ConsistencyIssue[]> {
    console.log('🔍 Running data consistency checks...');
    
    const checks = [
      this.checkOrphanedRecords(),
      this.checkInvalidForeignKeys(),
      this.checkDuplicateRecords(),
      this.checkDataIntegrity(),
      this.checkReferentialIntegrity(),
      this.checkBusinessRules(),
      this.checkAuditTrail(),
      this.checkSoftDeleteConsistency(),
    ];

    const results = await Promise.allSettled(checks);
    const issues: ConsistencyIssue[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        issues.push(...result.value);
      } else {
        console.error(`Check ${index} failed:`, result.reason);
        issues.push({
          type: 'system_error',
          severity: 'high',
          description: `Consistency check failed: ${result.reason}`,
          table: 'system',
        });
      }
    });

    console.log(`📊 Found ${issues.length} consistency issues`);
    return issues;
  }

  private async checkOrphanedRecords(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check orders with invalid customer references
    const orphanedOrders = await this.db
      .select({ count: count() })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.customerId, schema.users.id))
      .where(and(
        isNull(schema.users.id),
        isNull(schema.orders.deletedAt)
      ));

    if (orphanedOrders[0]?.count > 0) {
      issues.push({
        type: 'orphaned_records',
        severity: 'high',
        description: 'Orders with invalid customer references',
        table: 'orders',
        count: orphanedOrders[0].count,
        fix: 'Update or delete orders with invalid customer references'
      });
    }

    // Check products with invalid category references
    const orphanedProducts = await this.db
      .select({ count: count() })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.category, schema.categories.id))
      .where(and(
        isNull(schema.categories.id),
        isNull(schema.products.deletedAt)
      ));

    if (orphanedProducts[0]?.count > 0) {
      issues.push({
        type: 'orphaned_records',
        severity: 'medium',
        description: 'Products with invalid category references',
        table: 'products',
        count: orphanedProducts[0].count,
        fix: 'Update product categories or delete orphaned products'
      });
    }

    return issues;
  }

  private async checkInvalidForeignKeys(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check for NULL foreign keys that shouldn't be NULL
    const nullCustomerOrders = await this.db
      .select({ count: count() })
      .from(schema.orders)
      .where(and(
        isNull(schema.orders.customerId),
        isNull(schema.orders.deletedAt)
      ));

    if (nullCustomerOrders[0]?.count > 0) {
      issues.push({
        type: 'invalid_foreign_key',
        severity: 'critical',
        description: 'Orders with NULL customer IDs',
        table: 'orders',
        count: nullCustomerOrders[0].count,
        fix: 'Assign valid customer IDs or delete invalid orders'
      });
    }

    return issues;
  }

  private async checkDuplicateRecords(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check duplicate phone numbers
    const duplicatePhones = await this.db.execute(`
      SELECT phone_number, COUNT(*) as count
      FROM users 
      WHERE deleted_at IS NULL
      GROUP BY phone_number 
      HAVING COUNT(*) > 1
    `);

    if (duplicatePhones.length > 0) {
      issues.push({
        type: 'duplicate_records',
        severity: 'high',
        description: 'Duplicate phone numbers found',
        table: 'users',
        count: duplicatePhones.length,
        details: duplicatePhones,
        fix: 'Merge or remove duplicate user records'
      });
    }

    // Check duplicate promo codes
    const duplicatePromoCodes = await this.db.execute(`
      SELECT code, COUNT(*) as count
      FROM promo_codes 
      WHERE deleted_at IS NULL
      GROUP BY code 
      HAVING COUNT(*) > 1
    `);

    if (duplicatePromoCodes.length > 0) {
      issues.push({
        type: 'duplicate_records',
        severity: 'medium',
        description: 'Duplicate promo codes found',
        table: 'promo_codes',
        count: duplicatePromoCodes.length,
        details: duplicatePromoCodes,
        fix: 'Remove duplicate promo code records'
      });
    }

    return issues;
  }

  private async checkDataIntegrity(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check negative prices
    const negativePrices = await this.db
      .select({ count: count() })
      .from(schema.products)
      .where(and(
        lte(schema.products.price, 0),
        isNull(schema.products.deletedAt)
      ));

    if (negativePrices[0]?.count > 0) {
      issues.push({
        type: 'data_integrity',
        severity: 'high',
        description: 'Products with negative or zero prices',
        table: 'products',
        count: negativePrices[0].count,
        fix: 'Update product prices to positive values'
      });
    }

    // Check invalid phone number formats
    const invalidPhones = await this.db
      .select({ count: count() })
      .from(schema.users)
      .where(and(
        sql`phone_number !~ '^\+998\d{9}$'`,
        isNull(schema.users.deletedAt)
      ));

    if (invalidPhones[0]?.count > 0) {
      issues.push({
        type: 'data_integrity',
        severity: 'medium',
        description: 'Users with invalid phone number formats',
        table: 'users',
        count: invalidPhones[0].count,
        fix: 'Update phone numbers to valid Uzbek format (+998XXXXXXXXX)'
      });
    }

    // Check orders with negative totals
    const negativeTotals = await this.db
      .select({ count: count() })
      .from(schema.orders)
      .where(and(
        lte(schema.orders.total, 0),
        isNull(schema.orders.deletedAt)
      ));

    if (negativeTotals[0]?.count > 0) {
      issues.push({
        type: 'data_integrity',
        severity: 'high',
        description: 'Orders with negative or zero totals',
        table: 'orders',
        count: negativeTotals[0].count,
        fix: 'Update order totals to positive values'
      });
    }

    return issues;
  }

  private async checkReferentialIntegrity(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check audit logs for deleted records
    const orphanedAuditLogs = await this.db.execute(`
      SELECT al.table_name, COUNT(*) as count
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id IS NOT NULL 
        AND u.id IS NULL
      GROUP BY al.table_name
    `);

    orphanedAuditLogs.forEach(log => {
      if (log.count > 0) {
        issues.push({
          type: 'referential_integrity',
          severity: 'low',
          description: `Audit logs with deleted user references for ${log.table_name}`,
          table: 'audit_logs',
          count: log.count,
          fix: 'Update audit log user references or remove orphaned logs'
        });
      }
    });

    return issues;
  }

  private async checkBusinessRules(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check orders with invalid status transitions
    const invalidStatusOrders = await this.db.execute(`
      SELECT o.id, o.status, o.created_at
      FROM orders o
      WHERE o.deleted_at IS NULL
        AND o.status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')
    `);

    if (invalidStatusOrders.length > 0) {
      issues.push({
        type: 'business_rule_violation',
        severity: 'medium',
        description: 'Orders with invalid status values',
        table: 'orders',
        count: invalidStatusOrders.length,
        details: invalidStatusOrders,
        fix: 'Update order status to valid values'
      });
    }

    // Check promo codes with invalid discount percentages
    const invalidDiscounts = await this.db
      .select({ count: count() })
      .from(schema.promoCodes)
      .where(and(
        sql`discount_percent < 1 OR discount_percent > 100`,
        isNull(schema.promoCodes.deletedAt)
      ));

    if (invalidDiscounts[0]?.count > 0) {
      issues.push({
        type: 'business_rule_violation',
        severity: 'medium',
        description: 'Promo codes with invalid discount percentages',
        table: 'promo_codes',
        count: invalidDiscounts[0].count,
        fix: 'Update discount percentages to range 1-100'
      });
    }

    // Check expired active promo codes
    const expiredActiveCodes = await this.db
      .select({ count: count() })
      .from(schema.promoCodes)
      .where(and(
        sql`valid_until < NOW()`,
        eq(schema.promoCodes.isActive, true),
        isNull(schema.promoCodes.deletedAt)
      ));

    if (expiredActiveCodes[0]?.count > 0) {
      issues.push({
        type: 'business_rule_violation',
        severity: 'low',
        description: 'Expired promo codes that are still active',
        table: 'promo_codes',
        count: expiredActiveCodes[0].count,
        fix: 'Deactivate expired promo codes'
      });
    }

    return issues;
  }

  private async checkAuditTrail(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check for missing audit logs for recent changes
    const recentUsers = await this.db.execute(`
      SELECT u.id, u.updated_at
      FROM users u
      WHERE u.deleted_at IS NULL
        AND u.updated_at > NOW() - INTERVAL '1 hour'
        AND NOT EXISTS (
          SELECT 1 FROM audit_logs al 
          WHERE al.table_name = 'users' 
            AND al.record_id = u.id 
            AND al.created_at > u.updated_at - INTERVAL '5 minutes'
        )
    `);

    if (recentUsers.length > 0) {
      issues.push({
        type: 'audit_trail_gap',
        severity: 'medium',
        description: 'Recent user changes without audit logs',
        table: 'users',
        count: recentUsers.length,
        fix: 'Ensure audit logging is working properly for all operations'
      });
    }

    return issues;
  }

  private async checkSoftDeleteConsistency(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Check records with deletedAt but still active
    const inconsistentDeletes = await this.db.execute(`
      SELECT 'users' as table_name, COUNT(*) as count
      FROM users 
      WHERE deleted_at IS NOT NULL AND is_active = true
      UNION ALL
      SELECT 'products' as table_name, COUNT(*) as count
      FROM products 
      WHERE deleted_at IS NOT NULL AND is_active = true
      UNION ALL
      SELECT 'orders' as table_name, COUNT(*) as count
      FROM orders 
      WHERE deleted_at IS NOT NULL AND is_active = true
      UNION ALL
      SELECT 'categories' as table_name, COUNT(*) as count
      FROM categories 
      WHERE deleted_at IS NOT NULL AND is_active = true
      UNION ALL
      SELECT 'promo_codes' as table_name, COUNT(*) as count
      FROM promo_codes 
      WHERE deleted_at IS NOT NULL AND is_active = true
    `);

    inconsistentDeletes.forEach(row => {
      if (row.count > 0) {
        issues.push({
          type: 'soft_delete_inconsistency',
          severity: 'medium',
          description: `${row.table_name} with deletedAt but still active`,
          table: row.table_name,
          count: row.count,
          fix: 'Update is_active to false for deleted records'
        });
      }
    });

    return issues;
  }

  async fixIssues(issues: ConsistencyIssue[]): Promise<{ fixed: number; failed: number }> {
    let fixed = 0;
    let failed = 0;

    for (const issue of issues) {
      try {
        await this.fixIssue(issue);
        fixed++;
        console.log(`✅ Fixed: ${issue.description}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to fix: ${issue.description}`, error);
      }
    }

    return { fixed, failed };
  }

  private async fixIssue(issue: ConsistencyIssue): Promise<void> {
    switch (issue.type) {
      case 'soft_delete_inconsistency':
        // Fix soft delete inconsistencies
        for (const table of ['users', 'products', 'orders', 'categories', 'promo_codes']) {
          if (issue.table === table) {
            const schemaTable = (schema as any)[table];
            await this.db
              .update(schemaTable)
              .set({ isActive: false })
              .where(sql`deleted_at IS NOT NULL AND is_active = true`);
          }
        }
        break;

      case 'business_rule_violation':
        if (issue.table === 'promo_codes' && issue.description.includes('expired')) {
          await this.db
            .update(schema.promoCodes)
            .set({ isActive: false })
            .where(and(
              sql`valid_until < NOW()`,
              eq(schema.promoCodes.isActive, true)
            ));
        }
        break;

      default:
        throw new Error(`Automatic fix not available for issue type: ${issue.type}`);
    }
  }

  async scheduleConsistencyChecks(): Promise<void> {
    const schedule = require('node-schedule');
    
    // Run consistency checks daily at 3 AM
    schedule.scheduleJob('0 3 * * *', async () => {
      try {
        const issues = await this.runAllChecks();
        
        if (issues.length > 0) {
          console.warn(`⚠️ Found ${issues.length} consistency issues`);
          
          // Auto-fix low severity issues
          const autoFixable = issues.filter(i => i.severity === 'low');
          if (autoFixable.length > 0) {
            const result = await this.fixIssues(autoFixable);
            console.log(`🔧 Auto-fixed ${result.fixed} issues, ${result.failed} failed`);
          }
        }
        
        console.log('✅ Daily consistency check completed');
      } catch (error) {
        console.error('❌ Scheduled consistency check failed:', error);
      }
    });

    console.log('✅ Consistency monitoring enabled (daily at 3 AM)');
  }

  async generateConsistencyReport(): Promise<string> {
    const issues = await this.runAllChecks();
    
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      severityBreakdown: {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
      },
      issues: issues,
    };

    const reportPath = `consistency-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await require('fs').promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Consistency report generated: ${reportPath}`);
    return reportPath;
  }
}

export const consistencyService = new ConsistencyService();
