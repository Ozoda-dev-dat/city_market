import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface OrderHistoryItem extends schema.Order {
  customer: schema.User;
  courier?: schema.User;
  promoCode?: schema.PromoCode;
  items: OrderItem[];
  tracking?: OrderTracking;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderTracking {
  status: string;
  timestamp: Date;
  location?: string;
  notes?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategory: string;
  orderFrequency: string;
  lastOrderDate?: Date;
}

export class OrderHistoryService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async getOrderHistory(
    userId: string,
    limit = 20,
    offset = 0,
    status?: string
  ): Promise<OrderHistoryItem[]> {
    try {
      const conditions = [
        eq(schema.orders.customerId, userId),
        isNull(schema.orders.deletedAt)
      ];

      if (status) {
        conditions.push(eq(schema.orders.status, status));
      }

      const orders = await this.db
        .select({
          order: schema.orders,
          customer: {
            id: schema.users.id,
            name: schema.users.name,
            phoneNumber: schema.users.phoneNumber,
            address: schema.users.address,
          },
          courier: {
            id: schema.users.id,
            name: schema.users.name,
            phoneNumber: schema.users.phoneNumber,
          },
          promoCode: {
            id: schema.promoCodes.id,
            code: schema.promoCodes.code,
            discountPercent: schema.promoCodes.discountPercent,
          }
        })
        .from(schema.orders)
        .leftJoin(schema.users, eq(schema.orders.courierId, schema.users.id))
        .leftJoin(schema.promoCodes, eq(schema.orders.promoCodeId, schema.promoCodes.id))
        .where(and(...conditions))
        .orderBy(desc(schema.orders.createdAt))
        .limit(limit)
        .offset(offset);

      // Process items and add tracking info
      const orderHistory: OrderHistoryItem[] = [];
      
      for (const orderData of orders) {
        const items = this.parseOrderItems(orderData.order.items);
        const tracking = await this.getOrderTracking(orderData.order.id);
        
        orderHistory.push({
          ...orderData.order,
          customer: orderData.customer,
          courier: orderData.courier || undefined,
          promoCode: orderData.promoCode || undefined,
          items,
          tracking
        });
      }

      return orderHistory;
    } catch (error) {
      console.error("Failed to get order history:", error);
      throw error;
    }
  }

  private parseOrderItems(itemsJson: any): OrderItem[] {
    try {
      const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
      
      return items.map((item: any) => ({
        productId: item.productId || item.id,
        productName: item.name || item.productName,
        productImage: item.image || item.productImage,
        quantity: item.quantity,
        unitPrice: item.price || item.unitPrice,
        totalPrice: item.totalPrice || (item.quantity * (item.price || item.unitPrice))
      }));
    } catch (error) {
      console.error("Failed to parse order items:", error);
      return [];
    }
  }

  async getOrderDetails(orderId: string): Promise<OrderHistoryItem | null> {
    try {
      const orderData = await this.db
        .select({
          order: schema.orders,
          customer: {
            id: schema.users.id,
            name: schema.users.name,
            phoneNumber: schema.users.phoneNumber,
            address: schema.users.address,
          },
          courier: {
            id: schema.users.id,
            name: schema.users.name,
            phoneNumber: schema.users.phoneNumber,
          },
          promoCode: {
            id: schema.promoCodes.id,
            code: schema.promoCodes.code,
            discountPercent: schema.promoCodes.discountPercent,
          }
        })
        .from(schema.orders)
        .leftJoin(schema.users, eq(schema.orders.courierId, schema.users.id))
        .leftJoin(schema.promoCodes, eq(schema.orders.promoCodeId, schema.promoCodes.id))
        .where(and(
          eq(schema.orders.id, orderId),
          isNull(schema.orders.deletedAt)
        ))
        .limit(1);

      if (!orderData[0]) {
        return null;
      }

      const items = this.parseOrderItems(orderData[0].order.items);
      const tracking = await this.getOrderTracking(orderId);

      return {
        ...orderData[0].order,
        customer: orderData[0].customer,
        courier: orderData[0].courier || undefined,
        promoCode: orderData[0].promoCode || undefined,
        items,
        tracking
      };
    } catch (error) {
      console.error("Failed to get order details:", error);
      throw error;
    }
  }

  async getOrderTracking(orderId: string): Promise<OrderTracking[]> {
    try {
      // This would typically come from a separate order_tracking table
      // For now, we'll create tracking based on order status changes
      const order = await this.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!order[0]) {
        return [];
      }

      const tracking: OrderTracking[] = [
        {
          status: 'pending',
          timestamp: order[0].createdAt,
          notes: 'Order placed successfully'
        }
      ];

      // Add status updates based on timestamps (simplified)
      if (order[0].status !== 'pending') {
        tracking.push({
          status: 'confirmed',
          timestamp: new Date(order[0].createdAt.getTime() + 30 * 60 * 1000), // 30 mins later
          notes: 'Order confirmed and being prepared'
        });
      }

      if (['delivering', 'delivered'].includes(order[0].status)) {
        tracking.push({
          status: 'delivering',
          timestamp: new Date(order[0].createdAt.getTime() + 60 * 60 * 1000), // 1 hour later
          notes: 'Order is out for delivery'
        });
      }

      if (order[0].status === 'delivered') {
        tracking.push({
          status: 'delivered',
          timestamp: new Date(order[0].createdAt.getTime() + 90 * 60 * 1000), // 1.5 hours later
          notes: 'Order delivered successfully'
        });
      }

      return tracking;
    } catch (error) {
      console.error("Failed to get order tracking:", error);
      return [];
    }
  }

  async getOrderStats(userId: string): Promise<OrderStats> {
    try {
      const orders = await this.db
        .select()
        .from(schema.orders)
        .where(and(
          eq(schema.orders.customerId, userId),
          isNull(schema.orders.deletedAt)
        ));

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Find favorite category
      const categoryCounts: Record<string, number> = {};
      orders.forEach(order => {
        const items = this.parseOrderItems(order.items);
        items.forEach(item => {
          // This would need category info from products table
          categoryCounts[item.productId] = (categoryCounts[item.productId] || 0) + 1;
        });
      });

      const favoriteCategory = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b, ''
      );

      // Calculate order frequency
      const orderDates = orders.map(o => o.createdAt).sort((a, b) => a.getTime() - b.getTime());
      let orderFrequency = 'No orders yet';
      
      if (orderDates.length > 1) {
        const daysDiff = (orderDates[orderDates.length - 1].getTime() - orderDates[0].getTime()) / (1000 * 60 * 60 * 24);
        const avgDaysBetween = daysDiff / (orderDates.length - 1);
        
        if (avgDaysBetween < 7) orderFrequency = 'Daily';
        else if (avgDaysBetween < 14) orderFrequency = 'Weekly';
        else if (avgDaysBetween < 30) orderFrequency = 'Bi-weekly';
        else if (avgDaysBetween < 60) orderFrequency = 'Monthly';
        else orderFrequency = 'Occasional';
      } else if (orderDates.length === 1) {
        orderFrequency = 'First order';
      }

      return {
        totalOrders,
        totalSpent,
        averageOrderValue,
        favoriteCategory,
        orderFrequency,
        lastOrderDate: orderDates.length > 0 ? orderDates[orderDates.length - 1] : undefined
      };
    } catch (error) {
      console.error("Failed to get order stats:", error);
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        favoriteCategory: '',
        orderFrequency: 'No orders yet'
      };
    }
  }

  async reorderItems(userId: string, orderItems: OrderItem[]): Promise<schema.Order> {
    try {
      // Create a new order with the same items
      const total = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      const newOrder = await this.db
        .insert(schema.orders)
        .values({
          id: `order-${Date.now()}`,
          customerId: userId,
          customerName: 'Customer', // Would get from user data
          phoneNumber: '+998000000000', // Would get from user data
          address: 'Default Address', // Would get from user data
          total,
          items: JSON.stringify(orderItems.map(item => ({
            productId: item.productId,
            name: item.productName,
            image: item.productImage,
            quantity: item.quantity,
            price: item.unitPrice,
            totalPrice: item.totalPrice
          }))),
          status: 'pending'
        })
        .returning();

      return newOrder[0];
    } catch (error) {
      console.error("Failed to reorder items:", error);
      throw error;
    }
  }

  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<void> {
    try {
      // Verify order belongs to user
      const order = await this.db
        .select()
        .from(schema.orders)
        .where(and(
          eq(schema.orders.id, orderId),
          eq(schema.orders.customerId, userId),
          isNull(schema.orders.deletedAt)
        ))
        .limit(1);

      if (!order[0]) {
        throw new Error("Order not found");
      }

      if (!['pending', 'confirmed'].includes(order[0].status)) {
        throw new Error("Order cannot be cancelled at this stage");
      }

      // Update order status
      await this.db
        .update(schema.orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(schema.orders.id, orderId));

      // Log cancellation
      await this.db.insert(schema.auditLogs).values({
        tableName: 'orders',
        recordId: orderId,
        action: 'UPDATE',
        oldValues: { status: order[0].status },
        newValues: { status: 'cancelled', reason },
        userId,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Failed to cancel order:", error);
      throw error;
    }
  }

  async trackOrderLocation(orderId: string): Promise<{
    latitude?: string;
    longitude?: string;
    lastUpdate?: Date;
    estimatedDelivery?: Date;
  }> {
    try {
      // This would integrate with a real tracking service
      // For now, return mock data based on order status
      const order = await this.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!order[0]) {
        throw new Error("Order not found");
      }

      if (order[0].status === 'delivering') {
        return {
          latitude: order[0].latitude || '41.3112',
          longitude: order[0].longitude || '69.2797',
          lastUpdate: new Date(),
          estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000) // 30 mins from now
        };
      }

      return {
        estimatedDelivery: order[0].status === 'confirmed' 
          ? new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
          : undefined
      };
    } catch (error) {
      console.error("Failed to track order location:", error);
      throw error;
    }
  }

  async getOrderReceipt(orderId: string): Promise<{
    order: OrderHistoryItem;
    receiptNumber: string;
    paymentMethod: string;
    taxAmount: number;
    receiptUrl: string;
  }> {
    try {
      const orderDetails = await this.getOrderDetails(orderId);
      
      if (!orderDetails) {
        throw new Error("Order not found");
      }

      const receiptNumber = `RCP-${orderId.slice(-8).toUpperCase()}`;
      const paymentMethod = 'Cash on Delivery'; // Would come from order data
      const taxAmount = Math.floor(orderDetails.total * 0.12); // 12% tax
      const receiptUrl = `/receipts/${receiptNumber}.pdf`;

      return {
        order: orderDetails,
        receiptNumber,
        paymentMethod,
        taxAmount,
        receiptUrl
      };
    } catch (error) {
      console.error("Failed to generate order receipt:", error);
      throw error;
    }
  }

  async exportOrderHistory(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const orders = await this.getOrderHistory(userId, 1000); // Get all orders
      
      if (format === 'csv') {
        // Convert to CSV format
        const headers = [
          'Order ID', 'Date', 'Status', 'Total', 'Items Count', 'Customer Name'
        ];
        
        const csvRows = [
          headers.join(','),
          ...orders.map(order => [
            order.id,
            order.createdAt.toISOString(),
            order.status,
            order.total.toString(),
            order.items.length.toString(),
            order.customer.name || 'N/A'
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        // Return JSON format
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          userId,
          totalOrders: orders.length,
          orders: orders.map(order => ({
            id: order.id,
            date: order.createdAt,
            status: order.status,
            total: order.total,
            items: order.items,
            customerName: order.customer.name
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error("Failed to export order history:", error);
      throw error;
    }
  }
}

export const orderHistoryService = new OrderHistoryService();
