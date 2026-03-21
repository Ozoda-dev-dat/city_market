import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export class TransactionService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async withTransaction<T>(
    operations: (tx: ReturnType<typeof drizzle>) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const {
      isolationLevel = 'READ_COMMITTED',
      timeout = 30000,
      retryCount = 3,
      retryDelay = 1000
    } = options;

    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const client = postgres(process.env.DATABASE_URL!, {
        max: 1,
        idle_timeout: timeout,
        connect_timeout: timeout,
      });
      
      const tx = drizzle(client, { schema });
      
      try {
        // Begin transaction with isolation level
        await tx.execute(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
        
        // Set transaction timeout
        await tx.execute(`SET LOCAL statement_timeout = ${timeout}`);
        
        // Execute operations
        const result = await operations(tx);
        
        // Commit transaction
        await tx.execute('COMMIT');
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Rollback on error
        try {
          await tx.execute('ROLLBACK');
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
        
        // Check if error is retryable
        if (this.isRetryableError(lastError) && attempt < retryCount) {
          console.warn(`Transaction failed (attempt ${attempt + 1}), retrying...`, lastError.message);
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
        
        throw lastError;
      } finally {
        await client.end();
      }
    }
    
    throw lastError!;
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'deadlock',
      'lock timeout',
      'connection',
      'timeout',
      'could not serialize',
      'serialization failure',
    ];
    
    const message = error.message.toLowerCase();
    return retryableErrors.some(err => message.includes(err));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Business transaction methods

  async createOrderWithItems(
    orderData: any,
    items: any[],
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.withTransaction(async (tx) => {
      // Validate stock availability
      for (const item of items) {
        const product = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.productId))
          .limit(1);

        if (!product[0]) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product[0].stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      // Create order
      const order = await tx
        .insert(schema.orders)
        .values({
          ...orderData,
          items: JSON.stringify(items),
        })
        .returning();

      // Update product stock
      for (const item of items) {
        await tx
          .update(schema.products)
          .set({
            stockQuantity: sql`${schema.products.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, item.productId));
      }

      // Log audit trail
      if (userId) {
        await tx.insert(schema.auditLogs).values({
          tableName: 'orders',
          recordId: order[0].id,
          action: 'INSERT',
          newValues: order[0],
          userId,
          ipAddress,
          userAgent,
        });
      }

      return order[0];
    });
  }

  async updateOrderStatusWithValidation(
    orderId: string,
    newStatus: string,
    courierId?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.withTransaction(async (tx) => {
      // Get current order
      const currentOrder = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!currentOrder[0]) {
        throw new Error('Order not found');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['delivering', 'cancelled'],
        'delivering': ['delivered', 'cancelled'],
        'delivered': [],
        'cancelled': []
      };

      const allowedStatuses = validTransitions[currentOrder[0].status] || [];
      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentOrder[0].status} to ${newStatus}`);
      }

      // Update order
      const updatedOrder = await tx
        .update(schema.orders)
        .set({
          status: newStatus,
          courierId: courierId || currentOrder[0].courierId,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      // Log audit trail
      if (userId) {
        await tx.insert(schema.auditLogs).values({
          tableName: 'orders',
          recordId: orderId,
          action: 'UPDATE',
          oldValues: currentOrder[0],
          newValues: updatedOrder[0],
          userId,
          ipAddress,
          userAgent,
        });
      }

      return updatedOrder[0];
    });
  }

  async applyPromoCodeToOrder(
    orderId: string,
    promoCode: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.withTransaction(async (tx) => {
      // Get order and promo code
      const [order, promo] = await Promise.all([
        tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1),
        tx.select().from(schema.promoCodes).where(eq(schema.promoCodes.code, promoCode)).limit(1),
      ]);

      if (!order[0]) {
        throw new Error('Order not found');
      }

      if (!promo[0]) {
        throw new Error('Promo code not found');
      }

      // Validate promo code
      if (!promo[0].isActive) {
        throw new Error('Promo code is not active');
      }

      if (promo[0].validUntil && new Date() > promo[0].validUntil) {
        throw new Error('Promo code has expired');
      }

      if (promo[0].usedCount >= promo[0].maxUses) {
        throw new Error('Promo code has reached maximum uses');
      }

      // Calculate discount
      const discount = Math.floor(order[0].total * (promo[0].discountPercent / 100));
      const newTotal = order[0].total - discount;

      // Update order
      const updatedOrder = await tx
        .update(schema.orders)
        .set({
          discount,
          total: newTotal,
          promoCodeId: promo[0].id,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      // Update promo code usage
      await tx
        .update(schema.promoCodes)
        .set({
          usedCount: promo[0].usedCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(schema.promoCodes.id, promo[0].id));

      // Log audit trail
      if (userId) {
        await tx.insert(schema.auditLogs).values({
          tableName: 'orders',
          recordId: orderId,
          action: 'UPDATE',
          oldValues: order[0],
          newValues: updatedOrder[0],
          userId,
          ipAddress,
          userAgent,
        });

        await tx.insert(schema.auditLogs).values({
          tableName: 'promo_codes',
          recordId: promo[0].id,
          action: 'UPDATE',
          oldValues: promo[0],
          newValues: { ...promo[0], usedCount: promo[0].usedCount + 1 },
          userId,
          ipAddress,
          userAgent,
        });
      }

      return updatedOrder[0];
    });
  }

  async bulkUpdateProducts(
    updates: Array<{ id: string; changes: any }>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any[]> {
    return this.withTransaction(async (tx) => {
      const results = [];

      for (const update of updates) {
        // Get current product
        const currentProduct = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, update.id))
          .limit(1);

        if (!currentProduct[0]) {
          throw new Error(`Product ${update.id} not found`);
        }

        // Update product
        const updatedProduct = await tx
          .update(schema.products)
          .set({
            ...update.changes,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, update.id))
          .returning();

        results.push(updatedProduct[0]);

        // Log audit trail
        if (userId) {
          await tx.insert(schema.auditLogs).values({
            tableName: 'products',
            recordId: update.id,
            action: 'UPDATE',
            oldValues: currentProduct[0],
            newValues: updatedProduct[0],
            userId,
            ipAddress,
            userAgent,
          });
        }
      }

      return results;
    });
  }

  async transferOrderToCourier(
    orderId: string,
    newCourierId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    return this.withTransaction(async (tx) => {
      // Validate courier exists and is available
      const courier = await tx
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.id, newCourierId),
          eq(schema.users.role, 'courier'),
          eq(schema.users.isActive, true)
        ))
        .limit(1);

      if (!courier[0]) {
        throw new Error('Courier not found or not available');
      }

      // Get current order
      const currentOrder = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!currentOrder[0]) {
        throw new Error('Order not found');
      }

      // Update order
      const updatedOrder = await tx
        .update(schema.orders)
        .set({
          courierId: newCourierId,
          status: 'delivering',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      // Log audit trail
      if (userId) {
        await tx.insert(schema.auditLogs).values({
          tableName: 'orders',
          recordId: orderId,
          action: 'UPDATE',
          oldValues: currentOrder[0],
          newValues: updatedOrder[0],
          userId,
          ipAddress,
          userAgent,
        });
      }

      return updatedOrder[0];
    });
  }

  async getTransactionMetrics(): Promise<any> {
    try {
      const metrics = await this.db.execute(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_transactions,
          COUNT(CASE WHEN state = 'idle in transaction' THEN 1 END) as idle_transactions,
          AVG(EXTRACT(EPOCH FROM (now() - xact_start))) as avg_transaction_duration
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return metrics[0];
    } catch (error) {
      console.error('Failed to get transaction metrics:', error);
      return null;
    }
  }

  async cleanupLongRunningTransactions(maxDurationMinutes = 30): Promise<number> {
    try {
      const result = await this.db.execute(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity 
        WHERE 
          datname = current_database()
          AND state = 'active'
          AND xact_start < now() - INTERVAL '${maxDurationMinutes} minutes'
          AND pid != pg_backend_pid()
      `);

      return result.length; // Number of terminated transactions
    } catch (error) {
      console.error('Failed to cleanup long-running transactions:', error);
      return 0;
    }
  }

  async scheduleTransactionMonitoring(): Promise<void> {
    const schedule = require('node-schedule');
    
    // Monitor transactions every 5 minutes
    schedule.scheduleJob('*/5 * * * *', async () => {
      try {
        const metrics = await this.getTransactionMetrics();
        if (metrics) {
          console.log('📊 Transaction metrics:', metrics);
          
          // Cleanup long-running transactions
          const terminated = await this.cleanupLongRunningTransactions();
          if (terminated > 0) {
            console.log(`🔧 Terminated ${terminated} long-running transactions`);
          }
        }
      } catch (error) {
        console.error('❌ Transaction monitoring failed:', error);
      }
    });

    console.log('✅ Transaction monitoring enabled (every 5 minutes)');
  }
}

export const transactionService = new TransactionService();
