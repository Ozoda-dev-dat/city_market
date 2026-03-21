import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, gte, lte, count } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface DashboardStats {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalProducts: number;
    activeOrders: number;
    pendingPayments: number;
    lowStockProducts: number;
  };
  sales: {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    yearRevenue: number;
    orderCount: {
      today: number;
      week: number;
      month: number;
      year: number;
    };
    averageOrderValue: {
      today: number;
      week: number;
      month: number;
      year: number;
    };
  };
  topProducts: Array<{
    product: schema.Product;
    totalSold: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    order: schema.Order;
    customer: schema.User;
  }>;
  alerts: Array<{
    type: 'low_stock' | 'high_value_order' | 'new_user' | 'system';
    message: string;
    data?: any;
    createdAt: Date;
  }>;
}

export class AdminDashboardService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      // Overview stats
      const [
        totalOrders,
        totalRevenue,
        totalUsers,
        totalProducts,
        activeOrders,
        pendingPayments,
        lowStockProducts
      ] = await Promise.all([
        this.getTotalCount('orders'),
        this.getTotalRevenue(),
        this.getTotalCount('users'),
        this.getTotalCount('products'),
        this.getActiveOrdersCount(),
        this.getPendingPaymentsCount(),
        this.getLowStockProductsCount()
      ]);

      // Sales stats
      const [
        todayRevenue,
        weekRevenue,
        monthRevenue,
        yearRevenue
      ] = await Promise.all([
        this.getRevenueSince(today),
        this.getRevenueSince(weekAgo),
        this.getRevenueSince(monthAgo),
        this.getRevenueSince(yearAgo)
      ]);

      const [
        todayOrders,
        weekOrders,
        monthOrders,
        yearOrders
      ] = await Promise.all([
        this.getOrderCountSince(today),
        this.getOrderCountSince(weekAgo),
        this.getOrderCountSince(monthAgo),
        this.getOrderCountSince(yearAgo)
      ]);

      // Top products
      const topProducts = await this.getTopProducts(5);

      // Recent orders
      const recentOrders = await this.getRecentOrders(10);

      // Alerts
      const alerts = await this.getSystemAlerts();

      return {
        overview: {
          totalOrders,
          totalRevenue,
          totalUsers,
          totalProducts,
          activeOrders,
          pendingPayments,
          lowStockProducts
        },
        sales: {
          todayRevenue,
          weekRevenue,
          monthRevenue,
          yearRevenue,
          orderCount: {
            today: todayOrders,
            week: weekOrders,
            month: monthOrders,
            year: yearOrders
          },
          averageOrderValue: {
            today: todayOrders > 0 ? todayRevenue / todayOrders : 0,
            week: weekOrders > 0 ? weekRevenue / weekOrders : 0,
            month: monthOrders > 0 ? monthRevenue / monthOrders : 0,
            year: yearOrders > 0 ? yearRevenue / yearOrders : 0
          }
        },
        topProducts,
        recentOrders,
        alerts
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  private async getTotalCount(table: string): Promise<number> {
    try {
      const result = await this.db.execute(`
        SELECT COUNT(*) as count 
        FROM ${table} 
        WHERE deleted_at IS NULL
      `);
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error(`Failed to get total count for ${table}:`, error);
      return 0;
    }
  }

  private async getTotalRevenue(): Promise<number> {
    try {
      const result = await this.db
        .select({ total: sql`SUM(total)` })
        .from(schema.orders)
        .where(and(
          eq(schema.orders.status, 'delivered'),
          isNull(schema.orders.deletedAt)
        ));
      return Number(result[0]?.total || 0);
    } catch (error) {
      console.error('Failed to get total revenue:', error);
      return 0;
    }
  }

  private async getRevenueSince(date: Date): Promise<number> {
    try {
      const result = await this.db
        .select({ total: sql`SUM(total)` })
        .from(schema.orders)
        .where(and(
          eq(schema.orders.status, 'delivered'),
          gte(schema.orders.createdAt, date),
          isNull(schema.orders.deletedAt)
        ));
      return Number(result[0]?.total || 0);
    } catch (error) {
      console.error('Failed to get revenue since date:', error);
      return 0;
    }
  }

  private async getOrderCountSince(date: Date): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.orders)
        .where(and(
          gte(schema.orders.createdAt, date),
          isNull(schema.orders.deletedAt)
        ));
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get order count since date:', error);
      return 0;
    }
  }

  private async getActiveOrdersCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.orders)
        .where(and(
          eq(schema.orders.status, 'confirmed'),
          isNull(schema.orders.deletedAt)
        ));
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get active orders count:', error);
      return 0;
    }
  }

  private async getPendingPaymentsCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.paymentTransactions)
        .where(and(
          eq(schema.paymentTransactions.status, 'pending'),
          isNull(schema.paymentTransactions.deletedAt)
        ));
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get pending payments count:', error);
      return 0;
    }
  }

  private async getLowStockProductsCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.products)
        .where(and(
          lte(schema.products.stockQuantity, 10),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ));
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get low stock products count:', error);
      return 0;
    }
  }

  private async getTopProducts(limit = 5): Promise<Array<{
    product: schema.Product;
    totalSold: number;
    revenue: number;
  }>> {
    try {
      // This is a simplified version - in production you'd want to calculate from order items
      const products = await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(desc(schema.products.stockQuantity))
        .limit(limit);

      return products.map(product => ({
        product,
        totalSold: Math.floor(Math.random() * 1000), // Mock data
        revenue: product.price * Math.floor(Math.random() * 1000) // Mock data
      }));
    } catch (error) {
      console.error('Failed to get top products:', error);
      return [];
    }
  }

  private async getRecentOrders(limit = 10): Promise<Array<{
    order: schema.Order;
    customer: schema.User;
  }>> {
    try {
      const orders = await this.db
        .select({
          order: schema.orders,
          customer: {
            id: schema.users.id,
            name: schema.users.name,
            phoneNumber: schema.users.phoneNumber,
          }
        })
        .from(schema.orders)
        .innerJoin(schema.users, eq(schema.orders.customerId, schema.users.id))
        .where(and(
          isNull(schema.orders.deletedAt)
        ))
        .orderBy(desc(schema.orders.createdAt))
        .limit(limit);

      return orders;
    } catch (error) {
      console.error('Failed to get recent orders:', error);
      return [];
    }
  }

  private async getSystemAlerts(): Promise<Array<{
    type: 'low_stock' | 'high_value_order' | 'new_user' | 'system';
    message: string;
    data?: any;
    createdAt: Date;
  }>> {
    const alerts = [];

    try {
      // Low stock alerts
      const lowStockProducts = await this.db
        .select()
        .from(schema.products)
        .where(and(
          lte(schema.products.stockQuantity, 5),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .limit(3);

      lowStockProducts.forEach(product => {
        alerts.push({
          type: 'low_stock',
          message: `Low stock: ${product.name} (${product.stockQuantity} units)`,
          data: { productId: product.id, stock: product.stockQuantity },
          createdAt: new Date()
        });
      });

      // High value orders
      const highValueOrders = await this.db
        .select()
        .from(schema.orders)
        .where(and(
          gte(schema.orders.total, 100000), // High value threshold
          eq(schema.orders.status, 'pending'),
          isNull(schema.orders.deletedAt)
        ))
        .orderBy(desc(schema.orders.total))
        .limit(3);

      highValueOrders.forEach(order => {
        alerts.push({
          type: 'high_value_order',
          message: `High value order: ${order.total} UZS`,
          data: { orderId: order.id, total: order.total },
          createdAt: order.createdAt
        });
      });

      // New users (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const newUsers = await this.db
        .select()
        .from(schema.users)
        .where(and(
          gte(schema.users.createdAt, oneDayAgo),
          eq(schema.users.role, 'customer')
        ))
        .orderBy(desc(schema.users.createdAt))
        .limit(3);

      if (newUsers.length > 0) {
        alerts.push({
          type: 'new_user',
          message: `${newUsers.length} new customer(s) registered today`,
          data: { count: newUsers.length },
          createdAt: new Date()
        });
      }

      return alerts;
    } catch (error) {
      console.error('Failed to get system alerts:', error);
      return [];
    }
  }

  async getSalesData(period: 'today' | 'week' | 'month' | 'year'): Promise<{
    revenue: number;
    orders: number;
    averageOrderValue: number;
    growth: number;
    breakdown: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  }> {
    try {
      const now = new Date();
      let startDate: Date;
      let groupBy: string;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          groupBy = 'DATE(created_at)';
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupBy = 'DATE(created_at)';
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          groupBy = 'DATE(created_at)';
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          groupBy = 'MONTH(created_at)';
          break;
      }

      // Get current period data
      const currentData = await this.db
        .select({
          date: sql`${groupBy}`,
          revenue: sql`SUM(total)`,
          orders: sql`COUNT(*)`
        })
        .from(schema.orders)
        .where(and(
          eq(schema.orders.status, 'delivered'),
          gte(schema.orders.createdAt, startDate),
          isNull(schema.orders.deletedAt)
        ))
        .groupBy(groupBy)
        .orderBy(groupBy);

      // Get previous period data for growth calculation
      let previousStartDate: Date;
      let previousEndDate = startDate;

      switch (period) {
        case 'today':
          previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousEndDate = startDate;
          break;
        case 'month':
          previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
          previousEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
          break;
        case 'year':
          previousStartDate = new Date(startDate.getFullYear() - 2, now.getMonth(), now.getDate());
          previousEndDate = new Date(startDate.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }

      const previousData = await this.db
        .select({
          revenue: sql`SUM(total)`,
          orders: sql`COUNT(*)`
        })
        .from(schema.orders)
        .where(and(
          eq(schema.orders.status, 'delivered'),
          gte(schema.orders.createdAt, previousStartDate),
          lt(schema.orders.createdAt, previousEndDate),
          isNull(schema.orders.deletedAt)
        ));

      const currentRevenue = Number(currentData.reduce((sum, d) => sum + Number(d.revenue), 0));
      const currentOrders = Number(currentData.reduce((sum, d) => sum + Number(d.orders), 0));
      const previousRevenue = Number(previousData[0]?.revenue || 0);
      const previousOrders = Number(previousData[0]?.orders || 0);

      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      return {
        revenue: currentRevenue,
        orders: currentOrders,
        averageOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
        growth: revenueGrowth,
        breakdown: currentData.map(d => ({
          date: d.date,
          revenue: Number(d.revenue),
          orders: Number(d.orders)
        }))
      };
    } catch (error) {
      console.error('Failed to get sales data:', error);
      throw error;
    }
  }

  async getUserGrowthStats(period: 'week' | 'month' | 'year'): Promise<{
    totalUsers: number;
    newUsers: number;
    growth: number;
    breakdown: Array<{
      date: string;
      users: number;
    }>;
  }> {
    try {
      const now = new Date();
      let startDate: Date;
      let groupBy: string;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupBy = 'DATE(created_at)';
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          groupBy = 'DATE(created_at)';
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          groupBy = 'MONTH(created_at)';
          break;
      }

      // Get current period data
      const currentData = await this.db
        .select({
          date: sql`${groupBy}`,
          users: sql`COUNT(*)`
        })
        .from(schema.users)
        .where(and(
          eq(schema.users.role, 'customer'),
          gte(schema.users.createdAt, startDate),
          isNull(schema.users.deletedAt)
        ))
        .groupBy(groupBy)
        .orderBy(groupBy);

      // Get previous period data
      let previousStartDate: Date;
      let previousEndDate = startDate;

      switch (period) {
        case 'week':
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousEndDate = startDate;
          break;
        case 'month':
          previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
          previousEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
          break;
        case 'year':
          previousStartDate = new Date(startDate.getFullYear() - 2, now.getMonth(), now.getDate());
          previousEndDate = new Date(startDate.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }

      const previousData = await this.db
        .select({ users: sql`COUNT(*)` })
        .from(schema.users)
        .where(and(
          eq(schema.users.role, 'customer'),
          gte(schema.users.createdAt, previousStartDate),
          lt(schema.users.createdAt, previousEndDate),
          isNull(schema.users.deletedAt)
        ));

      const totalUsers = await this.getTotalCount('users');
      const newUsers = Number(currentData.reduce((sum, d) => sum + Number(d.users), 0));
      const previousUsers = Number(previousData[0]?.users || 0);
      const growth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;

      return {
        totalUsers,
        newUsers,
        growth,
        breakdown: currentData.map(d => ({
          date: d.date,
          users: Number(d.users)
        }))
      };
    } catch (error) {
      console.error('Failed to get user growth stats:', error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<{
    database: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    performance: 'healthy' | 'warning' | 'error';
    lastCheck: Date;
  }> {
    try {
      const health = {
        database: 'healthy' as 'healthy' | 'warning' | 'error',
        storage: 'healthy' as 'healthy' | 'warning' | 'error',
        performance: 'healthy' as 'healthy' | 'warning' | 'error',
        lastCheck: new Date()
      };

      // Check database connectivity
      try {
        await this.db.select({ count: sql`COUNT(*)` }).from(schema.users);
      } catch (error) {
        health.database = 'error';
      }

      // Check storage (simplified check)
      try {
        const result = await this.db.execute(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);
        const size = result[0]?.size || '0 bytes';
        if (size.includes('GB') && parseInt(size) > 10) {
          health.storage = 'warning';
        }
      } catch (error) {
        health.storage = 'error';
      }

      // Check performance (simplified)
      try {
        const startTime = Date.now();
        await this.db.select({ count: sql`COUNT(*)` }).from(schema.users);
        const duration = Date.now() - startTime;
        
        if (duration > 1000) {
          health.performance = 'warning';
        }
      } catch (error) {
        health.performance = 'error';
      }

      return health;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        database: 'error',
        storage: 'error',
        performance: 'error',
        lastCheck: new Date()
      };
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
