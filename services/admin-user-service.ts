import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, gte, lte, count, like } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface UserWithDetails extends schema.User {
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  userGrowthRate: number;
  topCustomers: Array<{
    user: schema.User;
    totalSpent: number;
    orderCount: number;
    lastOrderDate: Date;
  }>;
}

export interface UserActivity {
  userId: string;
  lastLogin?: Date;
  loginCount: number;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  recentActivity: Array<{
      type: 'login' | 'order' | 'review' | 'wishlist';
      date: Date;
      details: any;
    }>;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  userCount: number;
}

export class AdminUserService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async getAllUsers(
    limit = 50,
    offset = 0,
    role?: string,
    status?: 'all' | 'active' | 'inactive',
    search?: string
  ): Promise<UserWithDetails[]> {
    try {
      let conditions: any[] = [isNull(schema.users.deletedAt)];

      if (role) {
        conditions.push(eq(schema.users.role, role));
      }

      if (status === 'active') {
        conditions.push(eq(schema.users.isActive, true));
      } else if (status === 'inactive') {
        conditions.push(eq(schema.users.isActive, false));
      }

      if (search) {
        conditions.push(
          or(
            like(schema.users.name, `%${search}%`),
            like(schema.users.phoneNumber, `%${search}%`),
            like(schema.users.email, `%${search}%`)
          )
        );
      }

      const users = await this.db
        .select({
          user: schema.users,
          orderCount: sql`(SELECT COUNT(*) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          totalSpent: sql`(SELECT COALESCECE(SUM(total), 0) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          lastOrderDate: sql`(SELECT MAX(created_at) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`
        })
        .from(schema.users)
        .where(and(...conditions))
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset);

      return users.map(u => ({
        ...u.user,
        orderCount: Number(u.orderCount),
        totalSpent: Number(u.totalSpent),
        lastOrderDate: u.lastOrderDate,
        isActive: u.user.isActive,
        roles: [u.user.role],
        permissions: this.getPermissionsForRole(u.user.role)
      }));
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserWithDetails | null> {
    try {
      const user = await this.db
        .select({
          user: schema.users,
          orderCount: sql`(SELECT COUNT(*) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          totalSpent: sql`(SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          lastOrderDate: sql`(SELECT MAX(created_at) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`
        })
        .from(schema.users)
        .where(and(
          eq(schema.users.id, userId),
          isNull(schema.users.deletedAt)
        ))
        .limit(1);

      if (!user[0]) {
        return null;
      }

      return {
        ...user[0].user,
        orderCount: Number(user[0].orderCount),
        totalSpent: Number(user[0].totalSpent),
        lastOrderDate: user[0].lastOrderDate,
        isActive: user[0].user.isActive,
        roles: [user[0].user.role],
        permissions: this.getPermissionsForRole(user[0].user.role)
      };
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      throw error;
    }
  }

  async createUser(userData: {
    name: string;
    phoneNumber: string;
    password: string;
    role: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }): Promise<schema.User> {
    try {
      // Check if phone number already exists
      const existingUser = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.phoneNumber, userData.phoneNumber))
        .limit(1);

      if (existingUser[0]) {
        throw new Error('Phone number already exists');
      }

      // Create user
      const result = await this.db
        .insert(schema.users)
        .values({
          ...userData,
          isActive: true,
        })
        .returning();

      // Log user creation
      await this.db.insert(schema.auditLogs).values({
        tableName: 'users',
        recordId: result[0].id,
        action: 'INSERT',
        newValues: result[0],
        userId: result[0].id,
        createdAt: new Date(),
      });

      return result[0];
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    updates: Partial<{
      name?: string;
      address?: string;
      latitude?: string;
      longitude?: string;
      role?: string;
      isActive?: boolean;
    }>,
    updatedBy: string
  ): Promise<schema.User> {
    try {
      // Get current user data
      const currentUser = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (!currentUser[0]) {
        throw new Error('User not found');
      }

      // Update user
      const result = await this.db
        .update(schema.users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId))
        .returning();

      // Log user update
      await this.db.insert(schema.auditLogs).values({
        tableName: 'users',
        recordId: userId,
        action: 'UPDATE',
        oldValues: currentUser[0],
        newValues: updates,
        userId: updatedBy,
        createdAt: new Date(),
      });

      return result[0];
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async softDeleteUser(userId: string, deletedBy: string): Promise<void> {
    try {
      // Soft delete user
      await this.db
        .update(schema.users)
        .set({
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));

      // Log soft delete
      await this.db.insert(schema.auditLogs).values({
        tableName: 'users',
        recordId: userId,
        action: 'UPDATE',
        oldValues: { isActive: true },
        newValues: { isActive: false, deletedAt: new Date() },
        userId: deletedBy,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to soft delete user:', error);
      throw error;
    }
  }

  async restoreUser(userId: string, restoredBy: string): Promise<schema.User> {
    try {
      // Restore user
      const result = await this.db
        .update(schema.users)
        .set({
          isActive: true,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId))
        .returning();

      // Log restoration
      await this.db.insert(schema.auditLogs).values({
        tableName: 'users',
        recordId: userId,
        action: 'UPDATE',
        oldValues: { isActive: false, deletedAt: new Date() },
        newValues: { isActive: true, deletedAt: null },
        userId: restoredBy,
        createdAt: new Date(),
      });

      return result[0];
    } catch (error) {
      console.error('Failed to restore user:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        usersByRoleResult,
        previousMonthUsers
      ] = await Promise.all([
        this.getTotalCount('users'),
        this.getActiveUsersCount(),
        this.getInactiveUsersCount(),
        this.getNewUsersCount(monthAgo),
        this.getUsersByRole(),
        this.getTotalCount('users', monthAgo)
      ]);

      const userGrowthRate = previousMonthUsers > 0 ? 
        ((totalUsers - previousMonthUsers) / previousMonthUsers) * 100 : 0;

      // Get top customers
      const topCustomers = await this.db
        .select({
          user: schema.users,
          totalSpent: sql`(SELECT COALESCECE(SUM(total), 0) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          orderCount: sql`(SELECT COUNT(*) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          lastOrderDate: sql`(SELECT MAX(created_at) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`
        })
        .from(schema.users)
        .where(and(
          eq(schema.users.role, 'customer'),
          isNull(schema.users.deletedAt)
        ))
        .orderBy(desc(sql`(SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`))
        .limit(10);

      const usersByRole: Record<string, number> = {};
      usersByRoleResult.forEach(row => {
        usersByRole[row.role] = Number(row.count);
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        usersByRole,
        userGrowthRate,
        topCustomers: topCustomers.map(c => ({
          user: c.user,
          totalSpent: Number(c.totalSpent),
          orderCount: Number(c.orderCount),
          lastOrderDate: c.lastOrderDate || new Date()
        }))
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw error;
    }
  }

  async getUserActivity(userId: string, days = 30): Promise<UserActivity> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's recent activity
      const recentOrders = await this.db
        .select({
          date: sql`DATE(created_at)`,
          count: sql`COUNT(*)`
        })
        .from(schema.orders)
        .where(and(
          eq(schema.orders.customerId, userId),
          gte(schema.orders.createdAt, startDate),
          isNull(schema.orders.deletedAt)
        ))
        .groupBy(sql`DATE(created_at)`)
        .orderBy(desc(sql`DATE(created_at)`);

      // Mock login data (in production, this would come from a login tracking table)
      const loginActivity = Array.from({ length: Math.min(days, 5) }, (_, i) => ({
        date: new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)),
        count: Math.floor(Math.random() * 5) + 1
      }));

      const recentActivity = [];
      
      // Combine order and login activity
      const allDates = new Set([
        ...recentOrders.map(r => r.date),
        ...loginActivity.map(l => l.date.toISOString().split('T')[0])
      ]);

      allDates.forEach(date => {
        const orderCount = recentOrders.find(r => r.date === date)?.count || 0;
        const loginCount = loginActivity.find(l => l.date.toISOString().split('T')[0] === date)?.count || 0;
        
        if (orderCount > 0) {
          recentActivity.push({
            type: 'order',
            date: new Date(date),
            details: { orderCount }
          });
        }
        
        if (loginCount > 0) {
          recentActivity.push({
            type: 'login',
            date: new Date(date),
            details: { loginCount }
          });
        }
      });

      const totalOrders = recentOrders.reduce((sum, r) => sum + r.count, 0);
      const totalLogins = loginActivity.reduce((sum, l) => sum + l.count, 0);
      const lastOrderDate = recentOrders[0]?.date;

      return {
        userId,
        lastLogin: loginActivity[loginActivity.length - 1]?.date,
        loginCount: totalLogins,
        orderCount: totalOrders,
        totalSpent: 0, // Would calculate from orders
        lastOrderDate,
        recentActivity: recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime())
      };
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw error;
    }
  }

  async searchUsers(query: string, limit = 20): Promise<UserWithDetails[]> {
    try {
      const users = await this.db
        .select({
          user: schema.users,
          orderCount: sql`(SELECT COUNT(*) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          totalSpent: sql`(SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`,
          lastOrderDate: sql`(SELECT MAX(created_at) FROM orders WHERE customer_id = users.id AND deleted_at IS NULL)`
        })
        .from(schema.users)
        .where(and(
          isNull(schema.users.deletedAt),
          or(
            like(schema.users.name, `%${query}%`),
            like(schema.users.phoneNumber, `%${query}%`),
            like(schema.users.email, `%${query}%`)
          )
        ))
        .orderBy(desc(schema.users.createdAt))
        .limit(limit);

      return users.map(u => ({
        ...u.user,
        orderCount: Number(u.orderCount),
        totalSpent: Number(u.totalSpent),
        lastOrderDate: u.lastOrderDate,
        isActive: u.user.isActive,
        roles: [u.user.role],
        permissions: this.getPermissionsForRole(u.user.role)
      }));
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<{
      isActive?: boolean;
      role?: string;
    }>,
    updatedBy: string
  ): Promise<number> {
    try {
      let updatedCount = 0;

      for (const userId of userIds) {
        await this.updateUser(userId, updates, updatedBy);
        updatedCount++;
      }

      return updatedCount;
    } catch (error) {
      console.error('Failed to bulk update users:', error);
      throw error;
    }
  }

  async exportUsers(
    format: 'json' | 'csv' = 'json',
    role?: string,
    status?: 'all' | 'active' | 'inactive',
    dateRange?: { start: Date; end: Date }
  ): Promise<string> {
    try {
      let conditions: any[] = [isNull(schema.users.deletedAt)];

      if (role) {
        conditions.push(eq(schema.users.role, role));
      }

      if (status === 'active') {
        conditions.push(eq(schema.users.isActive, true));
      } else if (status === 'inactive') {
        conditions.push(eq(schema.users.isActive, false));
      }

      if (dateRange) {
        conditions.push(
          gte(schema.users.createdAt, dateRange.start),
          lte(schema.users.createdAt, dateRange.end)
        );
      }

      const users = await this.db
        .select()
        .from(schema.users)
        .where(and(...conditions))
        .orderBy(desc(schema.users.createdAt));

      if (format === 'csv') {
        const headers = [
          'ID', 'Name', 'Phone Number', 'Email', 'Role', 'Address', 'Status',
          'Created At', 'Updated At', 'Is Active'
        ];
        
        const csvRows = [
          headers.join(','),
          ...users.map(user => [
            user.id,
            user.name || '',
            user.phoneNumber,
            user.email || '',
            user.role,
            user.address || '',
            user.isActive ? 'Active' : 'Inactive',
            user.createdAt.toISOString(),
            user.updatedAt.toISOString(),
            user.isActive.toString()
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          role,
          status,
          dateRange,
          totalUsers: users.length,
          users: users.map(user => ({
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            email: user.email,
            role: user.role,
            address: user.address,
            latitude: user.latitude,
            longitude: user.longitude,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error('Failed to export users:', error);
      throw error;
    }
  }

  private async getTotalCount(table: string, dateFilter?: Date): Promise<number> {
    try {
      let conditions: any[] = [isNull(`${table}.deleted_at`)];
      
      if (dateFilter) {
        conditions.push(gte(`${table}.created_at`, dateFilter));
      }

      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(sql.raw(table))
        .where(and(...conditions));

      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error(`Failed to get total count for ${table}:`, error);
      return 0;
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.users)
        .where(and(
          eq(schema.users.isActive, true),
          isNull(schema.users.deletedAt)
        ));

      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get active users count:', error);
      return 0;
    }
  }

  private async getInactiveUsersCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.users)
        .where(and(
          eq(schema.users.isActive, false),
          isNull(schema.users.deletedAt)
        ));

      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get inactive users count:', error);
      return 0;
    }
  }

  private async getNewUsersCount(sinceDate: Date): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.users)
        .where(and(
          gte(schema.users.createdAt, sinceDate),
          isNull(schema.users.deletedAt)
        ));

      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get new users count:', error);
      return 0;
    }
  }

  private async getUsersByRole(): Promise<Array<{ role: string; count: number }>> {
    try {
      const result = await this.db
        .select({
          role: schema.users.role,
          count: sql`COUNT(*)`
        })
        .from(schema.users)
        .where(isNull(schema.users.deletedAt))
        .groupBy(schema.users.role)
        .orderBy(desc(sql`COUNT(*)`));

      return result;
    } catch (error) {
      console.error('Failed to get users by role:', error);
      return [];
    }
  }

  private getPermissionsForRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'user.create', 'user.read', 'user.update', 'user.delete',
        'product.create', 'product.read', 'product.update', 'product.delete',
        'order.create', 'order.read', 'order.update', 'order.delete',
        'category.create', 'category.read', 'category.update', 'category.delete',
        'promo.create', 'promo.read', 'promo.update', 'promo.delete',
        'payment.read', 'payment.process', 'payment.refund',
        'inventory.read', 'inventory.update', 'inventory.manage',
        'analytics.read', 'settings.manage',
        'system.logs'
      ],
      courier: [
        'order.read', 'order.update', 'order.location',
        'analytics.read'
      ],
      customer: [
        'order.create', 'order.read', 'order.update',
        'product.read', 'category.read',
        'review.create', 'review.read',
        'wishlist.read', 'wishlist.manage',
        'profile.read', 'profile.update'
      ]
    };

    return rolePermissions[role] || [];
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.getUserById(userId);
      return user ? user.permissions : [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('Failed to check user permission:', error);
      return false;
    }
  }
}

export const adminUserService = new AdminUserService();
