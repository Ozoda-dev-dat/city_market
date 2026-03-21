import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, lte } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface NotificationData {
  userId: string;
  type: 'order_update' | 'promo' | 'product_available' | 'system' | 'reminder' | 'wishlist_price_drop';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date;
}

export interface NotificationWithDetails extends schema.Notification {
  user?: {
    id: string;
    name: string;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recent: number;
}

export class NotificationService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async createNotification(notificationData: NotificationData): Promise<schema.Notification> {
    try {
      // Verify user exists
      const user = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, notificationData.userId))
        .limit(1);

      if (!user[0]) {
        throw new Error("User not found");
      }

      const result = await this.db
        .insert(schema.notifications)
        .values({
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          priority: notificationData.priority || 'normal',
          expiresAt: notificationData.expiresAt,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    limit = 20,
    offset = 0,
    unreadOnly = false,
    type?: string
  ): Promise<NotificationWithDetails[]> {
    try {
      const conditions = [
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.deletedAt)
      ];

      if (unreadOnly) {
        conditions.push(eq(schema.notifications.isRead, false));
      }

      if (type) {
        conditions.push(eq(schema.notifications.type, type));
      }

      const notifications = await this.db
        .select({
          notification: schema.notifications,
          user: {
            id: schema.users.id,
            name: schema.users.name,
          }
        })
        .from(schema.notifications)
        .leftJoin(schema.users, eq(schema.notifications.userId, schema.users.id))
        .where(and(...conditions))
        .orderBy(desc(schema.notifications.priority), desc(schema.notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return notifications.map(n => ({
        ...n.notification,
        user: n.user || undefined
      }));
    } catch (error) {
      console.error("Failed to get user notifications:", error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // Verify notification belongs to user
      const notification = await this.db
        .select()
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId)
        ))
        .limit(1);

      if (!notification[0]) {
        throw new Error("Notification not found or access denied");
      }

      await this.db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.id, notificationId));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        ));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      // Verify notification belongs to user
      const notification = await this.db
        .select()
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId)
        ))
        .limit(1);

      if (!notification[0]) {
        throw new Error("Notification not found or access denied");
      }

      await this.db
        .delete(schema.notifications)
        .where(eq(schema.notifications.id, notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  }

  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const notifications = await this.db
        .select()
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, userId),
          isNull(schema.notifications.deletedAt)
        ));

      const total = notifications.length;
      const unread = notifications.filter(n => !n.isRead).length;

      // Group by type
      const byType: Record<string, number> = {};
      notifications.forEach(n => {
        byType[n.type] = (byType[n.type] || 0) + 1;
      });

      // Group by priority
      const byPriority: Record<string, number> = {};
      notifications.forEach(n => {
        byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
      });

      // Count recent notifications (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = notifications.filter(n => new Date(n.createdAt) > sevenDaysAgo).length;

      return {
        total,
        unread,
        byType,
        byPriority,
        recent
      };
    } catch (error) {
      console.error("Failed to get notification stats:", error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
        recent: 0
      };
    }
  }

  async sendOrderUpdateNotification(
    userId: string,
    orderId: string,
    status: string,
    courierName?: string
  ): Promise<void> {
    try {
      const statusMessages: Record<string, { title: string; message: string }> = {
        'confirmed': {
          title: 'Order Confirmed',
          message: 'Your order has been confirmed and is being prepared.'
        },
        'preparing': {
          title: 'Order Being Prepared',
          message: 'Your order is being prepared by our team.'
        },
        'ready': {
          title: 'Order Ready for Pickup',
          message: 'Your order is ready for pickup.'
        },
        'delivering': {
          title: 'Order Out for Delivery',
          message: courierName 
            ? `Your order is out for delivery with ${courierName}.`
            : 'Your order is out for delivery.'
        },
        'delivered': {
          title: 'Order Delivered',
          message: 'Your order has been successfully delivered!'
        },
        'cancelled': {
          title: 'Order Cancelled',
          message: 'Your order has been cancelled.'
        }
      };

      const messageData = statusMessages[status];
      if (!messageData) return;

      await this.createNotification({
        userId,
        type: 'order_update',
        ...messageData,
        data: { orderId, status },
        priority: status === 'delivered' ? 'high' : 'normal'
      });
    } catch (error) {
      console.error("Failed to send order update notification:", error);
    }
  }

  async sendPromoNotification(
    userId: string,
    promoCode: schema.PromoCode
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'promo',
        title: 'Special Offer!',
        message: `Get ${promoCode.discountPercent}% off with code: ${promoCode.code}`,
        data: { promoCodeId: promoCode.id, code: promoCode.code },
        priority: 'normal',
        expiresAt: promoCode.validUntil
      });
    } catch (error) {
      console.error("Failed to send promo notification:", error);
    }
  }

  async sendProductAvailableNotification(
    userId: string,
    productId: string,
    productName: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'product_available',
        title: 'Product Back in Stock!',
        message: `${productName} is now available again.`,
        data: { productId, productName },
        priority: 'normal'
      });
    } catch (error) {
      console.error("Failed to send product available notification:", error);
    }
  }

  async sendWishlistPriceDropNotification(
    userId: string,
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number
  ): Promise<void> {
    try {
      const savings = oldPrice - newPrice;
      await this.createNotification({
        userId,
        type: 'wishlist_price_drop',
        title: 'Price Drop Alert!',
        message: `${productName} price dropped by ${savings}! Now only ${newPrice}.`,
        data: { productId, productName, oldPrice, newPrice, savings },
        priority: 'high'
      });
    } catch (error) {
      console.error("Failed to send wishlist price drop notification:", error);
    }
  }

  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'system',
        title,
        message,
        priority
      });
    } catch (error) {
      console.error("Failed to send system notification:", error);
    }
  }

  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await this.db
        .delete(schema.notifications)
        .where(and(
          isNull(schema.notifications.deletedAt),
          lte(schema.notifications.expiresAt, new Date())
        ));

      return result.length; // Number of deleted notifications
    } catch (error) {
      console.error("Failed to cleanup expired notifications:", error);
      return 0;
    }
  }

  async broadcastNotification(
    title: string,
    message: string,
    type: 'system' | 'promo',
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    userRole?: string
  ): Promise<number> {
    try {
      let conditions = [eq(schema.users.isActive, true)];

      if (userRole) {
        conditions.push(eq(schema.users.role, userRole));
      }

      const users = await this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(and(...conditions));

      let sentCount = 0;

      for (const user of users) {
        try {
          await this.createNotification({
            userId: user.id,
            type,
            title,
            message,
            priority
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send notification to user ${user.id}:`, error);
        }
      }

      return sentCount;
    } catch (error) {
      console.error("Failed to broadcast notification:", error);
      return 0;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`count(*)` })
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false),
          isNull(schema.notifications.deletedAt)
        ));

      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  async scheduleNotification(
    notificationData: NotificationData,
    scheduledFor: Date
  ): Promise<void> {
    try {
      // This would typically use a job queue system like Bull Queue or similar
      // For now, we'll just log it and assume it's handled by a scheduler
      console.log(`Notification scheduled for ${scheduledFor.toISOString()}:`, notificationData);
      
      // In a real implementation, you would store this in a scheduled_notifications table
      // and have a background worker process that sends them at the appropriate time
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      throw error;
    }
  }

  async getNotificationPreferences(userId: string): Promise<{
    email: boolean;
    push: boolean;
    sms: boolean;
    types: Record<string, boolean>;
  }> {
    try {
      // This would typically come from a user_preferences table
      // For now, return default preferences
      return {
        email: true,
        push: true,
        sms: false,
        types: {
          order_update: true,
          promo: true,
          product_available: true,
          system: true,
          reminder: false,
          wishlist_price_drop: true
        }
      };
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      return {
        email: true,
        push: true,
        sms: false,
        types: {}
      };
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<{
      email: boolean;
      push: boolean;
      sms: boolean;
      types: Record<string, boolean>;
    }>
  ): Promise<void> {
    try {
      // This would update a user_preferences table
      console.log(`Updated notification preferences for user ${userId}:`, preferences);
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      throw error;
    }
  }

  async exportNotifications(
    userId: string,
    format: 'json' | 'csv' = 'json',
    dateRange?: { start: Date; end: Date }
  ): Promise<string> {
    try {
      let conditions = [
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.deletedAt)
      ];

      if (dateRange) {
        conditions.push(
          sql`${schema.notifications.createdAt} >= ${dateRange.start}`,
          sql`${schema.notifications.createdAt} <= ${dateRange.end}`
        );
      }

      const notifications = await this.db
        .select()
        .from(schema.notifications)
        .where(and(...conditions))
        .orderBy(desc(schema.notifications.createdAt));

      if (format === 'csv') {
        const headers = [
          'ID', 'Type', 'Title', 'Message', 'Priority', 'Read', 'Created At'
        ];
        
        const csvRows = [
          headers.join(','),
          ...notifications.map(n => [
            n.id,
            n.type,
            n.title,
            n.message,
            n.priority,
            n.isRead.toString(),
            n.createdAt.toISOString()
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          userId,
          dateRange,
          totalNotifications: notifications.length,
          notifications: notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            priority: n.priority,
            isRead: n.isRead,
            data: n.data,
            createdAt: n.createdAt,
            expiresAt: n.expiresAt
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error("Failed to export notifications:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
