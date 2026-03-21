import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { paymentGatewayService } from "./payment-gateway-service";

export interface RefundRequest {
  paymentTransactionId: string;
  amount: number;
  reason: string;
  userId: string;
  processedBy?: string;
  notes?: string;
}

export interface RefundWithDetails extends schema.Refund {
  paymentTransaction: {
    id: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: Date;
  };
  order: {
    id: string;
    total: number;
    status: string;
    customerName: string;
  };
  processor?: {
    id: string;
    name: string;
  };
}

export interface RefundStats {
  totalRefunds: number;
  totalAmount: number;
  pendingRefunds: number;
  approvedRefunds: number;
  rejectedRefunds: number;
  averageRefundAmount: number;
  refundReasons: Record<string, number>;
  monthlyBreakdown: Record<string, number>;
}

export class RefundService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async createRefundRequest(refundData: RefundRequest): Promise<schema.Refund> {
    try {
      // Validate payment transaction
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(and(
          eq(schema.paymentTransactions.id, refundData.paymentTransactionId),
          eq(schema.paymentTransactions.userId, refundData.userId),
          eq(schema.paymentTransactions.status, 'completed')
        ))
        .limit(1);

      if (!transaction[0]) {
        throw new Error("Payment transaction not found or not eligible for refund");
      }

      // Check if refund amount is valid
      if (refundData.amount > transaction[0].amount) {
        throw new Error("Refund amount cannot exceed original payment amount");
      }

      // Check for existing refund requests
      const existingRefunds = await this.db
        .select({ totalAmount: sql`SUM(${schema.refunds.amount})` })
        .from(schema.refunds)
        .where(eq(schema.refunds.paymentTransactionId, refundData.paymentTransactionId));

      const totalRefunded = Number(existingRefunds[0]?.totalAmount || 0);
      if (totalRefunded + refundData.amount > transaction[0].amount) {
        throw new Error("Total refund amount would exceed original payment");
      }

      // Create refund request
      const result = await this.db
        .insert(schema.refunds)
        .values({
          paymentTransactionId: refundData.paymentTransactionId,
          orderId: transaction[0].orderId,
          userId: refundData.userId,
          amount: refundData.amount,
          reason: refundData.reason,
          status: 'pending',
          processedBy: refundData.processedBy,
          metadata: refundData.notes ? { notes: refundData.notes } : {},
        })
        .returning();

      // Log refund request
      await this.db.insert(schema.auditLogs).values({
        tableName: 'refunds',
        recordId: result[0].id,
        action: 'INSERT',
        newValues: result[0],
        userId: refundData.userId,
        createdAt: new Date(),
      });

      return result[0];
    } catch (error) {
      console.error('Failed to create refund request:', error);
      throw error;
    }
  }

  async processRefund(
    refundId: string,
    action: 'approve' | 'reject',
    processedBy: string,
    notes?: string
  ): Promise<schema.Refund> {
    try {
      const refund = await this.db
        .select()
        .from(schema.refunds)
        .where(and(
          eq(schema.refunds.id, refundId),
          eq(schema.refunds.status, 'pending')
        ))
        .limit(1);

      if (!refund[0]) {
        throw new Error("Refund not found or not in pending status");
      }

      let updatedRefund: schema.Refund;

      if (action === 'approve') {
        // Process refund through payment gateway
        const gatewayRefundId = await this.processGatewayRefund(
          refund[0].paymentTransactionId,
          refund[0].amount,
          refund[0].reason
        );

        // Update transaction with refund info
        await this.db
          .update(schema.paymentTransactions)
          .set({
            status: 'refunded',
            refundedAt: new Date(),
            refundAmount: refund[0].amount,
            refundReason: refund[0].reason,
            updatedAt: new Date(),
          })
          .where(eq(schema.paymentTransactions.id, refund[0].paymentTransactionId));

        // Update refund status
        updatedRefund = await this.db
          .update(schema.refunds)
          .set({
            status: 'processed',
            processedBy,
            processedAt: new Date(),
            gatewayRefundId,
            metadata: { ...refund[0].metadata, notes },
          })
          .where(eq(schema.refunds.id, refundId))
          .returning();
      } else {
        // Reject refund
        updatedRefund = await this.db
          .update(schema.refunds)
          .set({
            status: 'rejected',
            processedBy,
            processedAt: new Date(),
            metadata: { ...refund[0].metadata, notes, rejectionReason: notes },
          })
          .where(eq(schema.refunds.id, refundId))
          .returning();
      }

      // Log refund processing
      await this.db.insert(schema.auditLogs).values({
        tableName: 'refunds',
        recordId: refundId,
        action: 'UPDATE',
        oldValues: { status: 'pending' },
        newValues: { status: updatedRefund[0].status, processedBy, notes },
        userId: processedBy,
        createdAt: new Date(),
      });

      return updatedRefund[0];
    } catch (error) {
      console.error('Failed to process refund:', error);
      throw error;
    }
  }

  private async processGatewayRefund(
    paymentTransactionId: string,
    amount: number,
    reason: string
  ): Promise<string> {
    try {
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, paymentTransactionId))
        .limit(1);

      if (!transaction[0]) {
        throw new Error("Payment transaction not found");
      }

      switch (transaction[0].paymentMethod) {
        case 'stripe':
          return await this.processStripeRefund(transaction[0].gatewayTransactionId, amount, reason);
        
        case 'paypal':
          return await this.processPayPalRefund(transaction[0].gatewayTransactionId, amount, reason);
        
        case 'cash_on_delivery':
          // For cash on delivery, no gateway processing needed
          return `COD_REFUND_${Date.now()}`;
        
        default:
          throw new Error(`Refunds not supported for payment method: ${transaction[0].paymentMethod}`);
      }
    } catch (error) {
      console.error('Failed to process gateway refund:', error);
      throw error;
    }
  }

  private async processStripeRefund(
    paymentIntentId: string,
    amount: number,
    reason: string
  ): Promise<string> {
    try {
      // In a real implementation:
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const refund = await stripe.refunds.create({
      //   payment_intent: paymentIntentId,
      //   amount: Math.round(amount * 100), // Convert to cents
      //   reason: 'requested_by_customer',
      //   metadata: { reason },
      // });
      // return refund.id;

      // Mock refund ID
      return `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      console.error('Failed to process Stripe refund:', error);
      throw error;
    }
  }

  private async processPayPalRefund(
    orderId: string,
    amount: number,
    reason: string
  ): Promise<string> {
    try {
      // In a real implementation:
      // const paypal = require('@paypal/checkout-server-sdk');
      // const request = new paypal.payments.CapturesRefundRequest(captureId);
      // request.requestBody({
      //   amount: { currency_code: 'UZS', value: amount.toString() },
      //   note_to_payer: reason,
      // });
      // const refund = await paypalClient().execute(request);
      // return refund.result.id;

      // Mock refund ID
      return `PAYPAL_REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      console.error('Failed to process PayPal refund:', error);
      throw error;
    }
  }

  async getRefundRequests(
    userId?: string,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<RefundWithDetails[]> {
    try {
      let conditions: any[] = [isNull(schema.refunds.deletedAt)];

      if (userId) {
        conditions.push(eq(schema.refunds.userId, userId));
      }

      if (status) {
        conditions.push(eq(schema.refunds.status, status));
      }

      const refunds = await this.db
        .select({
          refund: schema.refunds,
          paymentTransaction: {
            id: schema.paymentTransactions.id,
            orderId: schema.paymentTransactions.orderId,
            amount: schema.paymentTransactions.amount,
            paymentMethod: schema.paymentTransactions.paymentMethod,
            status: schema.paymentTransactions.status,
            createdAt: schema.paymentTransactions.createdAt,
          },
          order: {
            id: schema.orders.id,
            total: schema.orders.total,
            status: schema.orders.status,
            customerName: schema.orders.customerName,
          },
          processor: {
            id: schema.users.id,
            name: schema.users.name,
          }
        })
        .from(schema.refunds)
        .innerJoin(schema.paymentTransactions, eq(schema.refunds.paymentTransactionId, schema.paymentTransactions.id))
        .innerJoin(schema.orders, eq(schema.refunds.orderId, schema.orders.id))
        .leftJoin(schema.users, eq(schema.refunds.processedBy, schema.users.id))
        .where(and(...conditions))
        .orderBy(desc(schema.refunds.createdAt))
        .limit(limit)
        .offset(offset);

      return refunds.map(r => ({
        ...r.refund,
        paymentTransaction: r.paymentTransaction,
        order: r.order,
        processor: r.processor || undefined
      }));
    } catch (error) {
      console.error('Failed to get refund requests:', error);
      throw error;
    }
  }

  async getRefundDetails(refundId: string): Promise<RefundWithDetails | null> {
    try {
      const refund = await this.db
        .select({
          refund: schema.refunds,
          paymentTransaction: {
            id: schema.paymentTransactions.id,
            orderId: schema.paymentTransactions.orderId,
            amount: schema.paymentTransactions.amount,
            paymentMethod: schema.paymentTransactions.paymentMethod,
            status: schema.paymentTransactions.status,
            createdAt: schema.paymentTransactions.createdAt,
            gatewayTransactionId: schema.paymentTransactions.gatewayTransactionId,
          },
          order: {
            id: schema.orders.id,
            total: schema.orders.total,
            status: schema.orders.status,
            customerName: schema.orders.customerName,
            phoneNumber: schema.orders.phoneNumber,
            address: schema.orders.address,
            items: schema.orders.items,
          },
          processor: {
            id: schema.users.id,
            name: schema.users.name,
            role: schema.users.role,
          }
        })
        .from(schema.refunds)
        .innerJoin(schema.paymentTransactions, eq(schema.refunds.paymentTransactionId, schema.paymentTransactions.id))
        .innerJoin(schema.orders, eq(schema.refunds.orderId, schema.orders.id))
        .leftJoin(schema.users, eq(schema.refunds.processedBy, schema.users.id))
        .where(eq(schema.refunds.id, refundId))
        .limit(1);

      if (!refund[0]) {
        return null;
      }

      return {
        ...refund[0].refund,
        paymentTransaction: refund[0].paymentTransaction,
        order: refund[0].order,
        processor: refund[0].processor || undefined
      };
    } catch (error) {
      console.error('Failed to get refund details:', error);
      return null;
    }
  }

  async getRefundStats(userId?: string): Promise<RefundStats> {
    try {
      let conditions: any[] = [isNull(schema.refunds.deletedAt)];

      if (userId) {
        conditions.push(eq(schema.refunds.userId, userId));
      }

      const refunds = await this.db
        .select()
        .from(schema.refunds)
        .where(and(...conditions));

      const totalRefunds = refunds.length;
      const totalAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
      const pendingRefunds = refunds.filter(r => r.status === 'pending').length;
      const approvedRefunds = refunds.filter(r => r.status === 'processed').length;
      const rejectedRefunds = refunds.filter(r => r.status === 'rejected').length;
      const averageRefundAmount = totalRefunds > 0 ? totalAmount / totalRefunds : 0;

      // Refund reasons breakdown
      const refundReasons: Record<string, number> = {};
      refunds.forEach(r => {
        refundReasons[r.reason] = (refundReasons[r.reason] || 0) + 1;
      });

      // Monthly breakdown
      const monthlyBreakdown: Record<string, number> = {};
      refunds.forEach(r => {
        const month = new Date(r.createdAt).toISOString().substring(0, 7); // YYYY-MM
        monthlyBreakdown[month] = (monthlyBreakdown[month] || 0) + r.amount;
      });

      return {
        totalRefunds,
        totalAmount,
        pendingRefunds,
        approvedRefunds,
        rejectedRefunds,
        averageRefundAmount,
        refundReasons,
        monthlyBreakdown
      };
    } catch (error) {
      console.error('Failed to get refund stats:', error);
      return {
        totalRefunds: 0,
        totalAmount: 0,
        pendingRefunds: 0,
        approvedRefunds: 0,
        rejectedRefunds: 0,
        averageRefundAmount: 0,
        refundReasons: {},
        monthlyBreakdown: {}
      };
    }
  }

  async getPendingRefunds(): Promise<schema.Refund[]> {
    try {
      const refunds = await this.db
        .select()
        .from(schema.refunds)
        .where(and(
          eq(schema.refunds.status, 'pending'),
          isNull(schema.refunds.deletedAt)
        ))
        .orderBy(asc(schema.refunds.createdAt));

      return refunds;
    } catch (error) {
      console.error('Failed to get pending refunds:', error);
      return [];
    }
  }

  async cancelRefundRequest(refundId: string, userId: string): Promise<void> {
    try {
      const refund = await this.db
        .select()
        .from(schema.refunds)
        .where(and(
          eq(schema.refunds.id, refundId),
          eq(schema.refunds.userId, userId),
          eq(schema.refunds.status, 'pending')
        ))
        .limit(1);

      if (!refund[0]) {
        throw new Error("Refund not found or not in pending status");
      }

      // Soft delete refund
      await this.db
        .update(schema.refunds)
        .set({ deletedAt: new Date() })
        .where(eq(schema.refunds.id, refundId));

      // Log cancellation
      await this.db.insert(schema.auditLogs).values({
        tableName: 'refunds',
        recordId: refundId,
        action: 'DELETE',
        oldValues: refund[0],
        userId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to cancel refund request:', error);
      throw error;
    }
  }

  async exportRefunds(
    userId?: string,
    format: 'json' | 'csv' = 'json',
    dateRange?: { start: Date; end: Date }
  ): Promise<string> {
    try {
      let conditions: any[] = [isNull(schema.refunds.deletedAt)];

      if (userId) {
        conditions.push(eq(schema.refunds.userId, userId));
      }

      if (dateRange) {
        conditions.push(
          sql`${schema.refunds.createdAt} >= ${dateRange.start}`,
          sql`${schema.refunds.createdAt} <= ${dateRange.end}`
        );
      }

      const refunds = await this.db
        .select({
          refund: schema.refunds,
          paymentTransaction: {
            paymentMethod: schema.paymentTransactions.paymentMethod,
          },
          order: {
            id: schema.orders.id,
            customerName: schema.orders.customerName,
          }
        })
        .from(schema.refunds)
        .innerJoin(schema.paymentTransactions, eq(schema.refunds.paymentTransactionId, schema.paymentTransactions.id))
        .innerJoin(schema.orders, eq(schema.refunds.orderId, schema.orders.id))
        .where(and(...conditions))
        .orderBy(desc(schema.refunds.createdAt));

      if (format === 'csv') {
        const headers = [
          'Refund ID', 'Order ID', 'Customer Name', 'Payment Method', 'Amount',
          'Reason', 'Status', 'Created At', 'Processed At', 'Processed By'
        ];
        
        const csvRows = [
          headers.join(','),
          ...refunds.map(r => [
            r.refund.id,
            r.order.id,
            r.order.customerName || '',
            r.paymentTransaction.paymentMethod,
            r.refund.amount.toString(),
            r.refund.reason,
            r.refund.status,
            r.refund.createdAt.toISOString(),
            r.refund.processedAt?.toISOString() || '',
            r.refund.processedBy || ''
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          userId: userId || 'all',
          dateRange,
          totalRefunds: refunds.length,
          refunds: refunds.map(r => ({
            id: r.refund.id,
            orderId: r.order.id,
            customerName: r.order.customerName,
            paymentMethod: r.paymentTransaction.paymentMethod,
            amount: r.refund.amount,
            reason: r.refund.reason,
            status: r.refund.status,
            createdAt: r.refund.createdAt,
            processedAt: r.refund.processedAt,
            processedBy: r.refund.processedBy,
            gatewayRefundId: r.refund.gatewayRefundId,
            metadata: r.refund.metadata
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error('Failed to export refunds:', error);
      throw error;
    }
  }

  async validateRefundEligibility(paymentTransactionId: string): Promise<{
    eligible: boolean;
    amount: number;
    alreadyRefunded: number;
    maxRefundable: number;
    reasons: string[];
  }> {
    try {
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, paymentTransactionId))
        .limit(1);

      if (!transaction[0]) {
        return {
          eligible: false,
          amount: 0,
          alreadyRefunded: 0,
          maxRefundable: 0,
          reasons: ['Transaction not found']
        };
      }

      if (transaction[0].status !== 'completed') {
        return {
          eligible: false,
          amount: transaction[0].amount,
          alreadyRefunded: 0,
          maxRefundable: 0,
          reasons: ['Payment not completed']
        };
      }

      // Check time limit (e.g., 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (new Date(transaction[0].createdAt) < thirtyDaysAgo) {
        return {
          eligible: false,
          amount: transaction[0].amount,
          alreadyRefunded: 0,
          maxRefundable: 0,
          reasons: ['Refund period expired (30 days)']
        };
      }

      // Check existing refunds
      const existingRefunds = await this.db
        .select({ totalAmount: sql`SUM(${schema.refunds.amount})` })
        .from(schema.refunds)
        .where(and(
          eq(schema.refunds.paymentTransactionId, paymentTransactionId),
          eq(schema.refunds.status, 'processed')
        ));

      const alreadyRefunded = Number(existingRefunds[0]?.totalAmount || 0);
      const maxRefundable = transaction[0].amount - alreadyRefunded;

      const reasons: string[] = [];
      if (maxRefundable <= 0) {
        reasons.push('Full amount already refunded');
      }

      return {
        eligible: maxRefundable > 0,
        amount: transaction[0].amount,
        alreadyRefunded,
        maxRefundable,
        reasons
      };
    } catch (error) {
      console.error('Failed to validate refund eligibility:', error);
      return {
        eligible: false,
        amount: 0,
        alreadyRefunded: 0,
        maxRefundable: 0,
        reasons: ['Validation failed']
      };
    }
  }
}

export const refundService = new RefundService();
