import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { paymentGatewayService } from "./payment-gateway-service";

export interface OrderPaymentData {
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'cash_on_delivery' | 'bank_transfer' | 'digital_wallet';
  paymentMethodId?: string;
  customerInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  };
}

export interface PaymentHistoryItem extends schema.PaymentTransaction {
  order: {
    id: string;
    total: number;
    status: string;
    createdAt: Date;
  };
  paymentMethod?: schema.PaymentMethod;
  refund?: schema.Refund;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averagePaymentAmount: number;
  paymentMethodBreakdown: Record<string, number>;
  monthlyBreakdown: Record<string, number>;
}

export class PaymentService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async processOrderPayment(paymentData: OrderPaymentData): Promise<{
    transaction: schema.PaymentTransaction;
    paymentIntent?: any;
    approvalUrl?: string;
  }> {
    try {
      // Validate order exists and is pending payment
      const order = await this.db
        .select()
        .from(schema.orders)
        .where(and(
          eq(schema.orders.id, paymentData.orderId),
          eq(schema.orders.customerId, paymentData.userId),
          isNull(schema.orders.deletedAt)
        ))
        .limit(1);

      if (!order[0]) {
        throw new Error("Order not found");
      }

      if (order[0].status !== 'pending') {
        throw new Error("Order is not in pending payment status");
      }

      // Process payment through gateway
      const transaction = await paymentGatewayService.processPayment(
        paymentData.orderId,
        paymentData.userId,
        paymentData.paymentMethod,
        paymentData.amount,
        paymentData.paymentMethodId
      );

      let paymentIntent, approvalUrl;

      // Get gateway-specific response
      if (paymentData.paymentMethod === 'stripe') {
        paymentIntent = await paymentGatewayService.createStripePaymentIntent(
          paymentData.amount,
          'UZS',
          paymentData.orderId,
          paymentData.userId,
          paymentData.customerInfo
        );
      } else if (paymentData.paymentMethod === 'paypal') {
        const paypalOrder = await paymentGatewayService.createPayPalOrder(
          paymentData.amount,
          'UZS',
          paymentData.orderId,
          paymentData.userId
        );
        approvalUrl = paypalOrder.links?.find((link: any) => link.rel === 'approve')?.href;
      }

      // Update order status to processing
      await this.db
        .update(schema.orders)
        .set({
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, paymentData.orderId));

      return {
        transaction,
        paymentIntent,
        approvalUrl
      };
    } catch (error) {
      console.error('Failed to process order payment:', error);
      throw error;
    }
  }

  async confirmPayment(
    transactionId: string,
    gatewayResponse?: any,
    userId?: string
  ): Promise<schema.PaymentTransaction> {
    try {
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        throw new Error("Payment transaction not found");
      }

      if (transaction[0].status === 'completed') {
        return transaction[0];
      }

      // Update transaction status
      const updatedTransaction = await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'completed',
          processedAt: new Date(),
          gatewayResponse: gatewayResponse || transaction[0].gatewayResponse,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.id, transactionId))
        .returning();

      // Update order status to confirmed
      await this.db
        .update(schema.orders)
        .set({
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, transaction[0].orderId));

      // Log payment confirmation
      if (userId) {
        await this.db.insert(schema.auditLogs).values({
          tableName: 'payment_transactions',
          recordId: transactionId,
          action: 'UPDATE',
          oldValues: { status: transaction[0].status },
          newValues: { status: 'completed' },
          userId,
          createdAt: new Date(),
        });
      }

      return updatedTransaction[0];
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      throw error;
    }
  }

  async failPayment(
    transactionId: string,
    errorMessage: string,
    gatewayResponse?: any
  ): Promise<schema.PaymentTransaction> {
    try {
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        throw new Error("Payment transaction not found");
      }

      // Update transaction status
      const updatedTransaction = await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'failed',
          gatewayError: errorMessage,
          gatewayResponse: gatewayResponse || transaction[0].gatewayResponse,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.id, transactionId))
        .returning();

      // Update order status back to pending
      await this.db
        .update(schema.orders)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, transaction[0].orderId));

      return updatedTransaction[0];
    } catch (error) {
      console.error('Failed to mark payment as failed:', error);
      throw error;
    }
  }

  async cancelPayment(
    transactionId: string,
    reason?: string,
    userId?: string
  ): Promise<schema.PaymentTransaction> {
    try {
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        throw new Error("Payment transaction not found");
      }

      if (transaction[0].status === 'completed') {
        throw new Error("Cannot cancel completed payment");
      }

      // Cancel with gateway if applicable
      if (transaction[0].paymentMethod === 'stripe' && transaction[0].gatewayTransactionId) {
        await paymentGatewayService.cancelStripePayment(transaction[0].gatewayTransactionId);
      }

      // Update transaction status
      const updatedTransaction = await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'cancelled',
          gatewayError: reason,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.id, transactionId))
        .returning();

      // Update order status back to pending
      await this.db
        .update(schema.orders)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, transaction[0].orderId));

      // Log cancellation
      if (userId) {
        await this.db.insert(schema.auditLogs).values({
          tableName: 'payment_transactions',
          recordId: transactionId,
          action: 'UPDATE',
          oldValues: { status: transaction[0].status },
          newValues: { status: 'cancelled', reason },
          userId,
          createdAt: new Date(),
        });
      }

      return updatedTransaction[0];
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      throw error;
    }
  }

  async getPaymentHistory(
    userId: string,
    limit = 20,
    offset = 0,
    status?: string,
    paymentMethod?: string
  ): Promise<PaymentHistoryItem[]> {
    try {
      const conditions = [
        eq(schema.paymentTransactions.userId, userId),
        isNull(schema.paymentTransactions.deletedAt)
      ];

      if (status) {
        conditions.push(eq(schema.paymentTransactions.status, status));
      }

      if (paymentMethod) {
        conditions.push(eq(schema.paymentTransactions.paymentMethod, paymentMethod));
      }

      const transactions = await this.db
        .select({
          transaction: schema.paymentTransactions,
          order: {
            id: schema.orders.id,
            total: schema.orders.total,
            status: schema.orders.status,
            createdAt: schema.orders.createdAt,
          },
          paymentMethod: {
            id: schema.paymentMethods.id,
            type: schema.paymentMethods.type,
            provider: schema.paymentMethods.provider,
            brand: schema.paymentMethods.brand,
            last4: schema.paymentMethods.last4,
          },
          refund: {
            id: schema.refunds.id,
            amount: schema.refunds.amount,
            status: schema.refunds.status,
            createdAt: schema.refunds.createdAt,
          }
        })
        .from(schema.paymentTransactions)
        .innerJoin(schema.orders, eq(schema.paymentTransactions.orderId, schema.orders.id))
        .leftJoin(schema.paymentMethods, eq(schema.paymentTransactions.gatewayTransactionId, schema.paymentMethods.providerMethodId))
        .leftJoin(schema.refunds, eq(schema.paymentTransactions.id, schema.refunds.paymentTransactionId))
        .where(and(...conditions))
        .orderBy(desc(schema.paymentTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      return transactions.map(t => ({
        ...t.transaction,
        order: t.order,
        paymentMethod: t.paymentMethod || undefined,
        refund: t.refund || undefined
      }));
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw error;
    }
  }

  async getPaymentStats(userId: string): Promise<PaymentStats> {
    try {
      const transactions = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(and(
          eq(schema.paymentTransactions.userId, userId),
          isNull(schema.paymentTransactions.deletedAt)
        ));

      const totalPayments = transactions.length;
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const successfulPayments = transactions.filter(t => t.status === 'completed').length;
      const failedPayments = transactions.filter(t => t.status === 'failed').length;
      
      const refundedTransactions = transactions.filter(t => t.status === 'refunded');
      const refundedAmount = refundedTransactions.reduce((sum, t) => sum + (t.refundAmount || 0), 0);
      
      const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

      // Payment method breakdown
      const paymentMethodBreakdown: Record<string, number> = {};
      transactions.forEach(t => {
        paymentMethodBreakdown[t.paymentMethod] = (paymentMethodBreakdown[t.paymentMethod] || 0) + 1;
      });

      // Monthly breakdown
      const monthlyBreakdown: Record<string, number> = {};
      transactions.forEach(t => {
        const month = new Date(t.createdAt).toISOString().substring(0, 7); // YYYY-MM
        monthlyBreakdown[month] = (monthlyBreakdown[month] || 0) + t.amount;
      });

      return {
        totalPayments,
        totalAmount,
        successfulPayments,
        failedPayments,
        refundedAmount,
        averagePaymentAmount,
        paymentMethodBreakdown,
        monthlyBreakdown
      };
    } catch (error) {
      console.error('Failed to get payment stats:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedAmount: 0,
        averagePaymentAmount: 0,
        paymentMethodBreakdown: {},
        monthlyBreakdown: {}
      };
    }
  }

  async getPaymentDetails(transactionId: string): Promise<PaymentHistoryItem | null> {
    try {
      const transaction = await this.db
        .select({
          transaction: schema.paymentTransactions,
          order: {
            id: schema.orders.id,
            total: schema.orders.total,
            status: schema.orders.status,
            createdAt: schema.orders.createdAt,
            customerName: schema.orders.customerName,
            phoneNumber: schema.orders.phoneNumber,
            address: schema.orders.address,
          },
          paymentMethod: {
            id: schema.paymentMethods.id,
            type: schema.paymentMethods.type,
            provider: schema.paymentMethods.provider,
            brand: schema.paymentMethods.brand,
            last4: schema.paymentMethods.last4,
          },
          refund: {
            id: schema.refunds.id,
            amount: schema.refunds.amount,
            status: schema.refunds.status,
            reason: schema.refunds.reason,
            createdAt: schema.refunds.createdAt,
          }
        })
        .from(schema.paymentTransactions)
        .innerJoin(schema.orders, eq(schema.paymentTransactions.orderId, schema.orders.id))
        .leftJoin(schema.paymentMethods, eq(schema.paymentTransactions.gatewayTransactionId, schema.paymentMethods.providerMethodId))
        .leftJoin(schema.refunds, eq(schema.paymentTransactions.id, schema.refunds.paymentTransactionId))
        .where(eq(schema.paymentTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        return null;
      }

      return {
        ...transaction[0].transaction,
        order: transaction[0].order,
        paymentMethod: transaction[0].paymentMethod || undefined,
        refund: transaction[0].refund || undefined
      };
    } catch (error) {
      console.error('Failed to get payment details:', error);
      return null;
    }
  }

  async retryPayment(transactionId: string): Promise<{
    transaction: schema.PaymentTransaction;
    paymentIntent?: any;
    approvalUrl?: string;
  }> {
    try {
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        throw new Error("Payment transaction not found");
      }

      if (transaction[0].status !== 'failed') {
        throw new Error("Only failed payments can be retried");
      }

      // Create new payment attempt
      const newPaymentData = {
        orderId: transaction[0].orderId,
        userId: transaction[0].userId,
        amount: transaction[0].amount,
        paymentMethod: transaction[0].paymentMethod as any,
      };

      return await this.processOrderPayment(newPaymentData);
    } catch (error) {
      console.error('Failed to retry payment:', error);
      throw error;
    }
  }

  async validatePaymentAmount(orderId: string, amount: number): Promise<boolean> {
    try {
      const order = await this.db
        .select({ total: schema.orders.total })
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!order[0]) {
        return false;
      }

      return order[0].total === amount;
    } catch (error) {
      console.error('Failed to validate payment amount:', error);
      return false;
    }
  }

  async getPendingPayments(): Promise<schema.PaymentTransaction[]> {
    try {
      const transactions = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(and(
          eq(schema.paymentTransactions.status, 'pending'),
          isNull(schema.paymentTransactions.deletedAt)
        ))
        .orderBy(asc(schema.paymentTransactions.createdAt));

      return transactions;
    } catch (error) {
      console.error('Failed to get pending payments:', error);
      return [];
    }
  }

  async exportPaymentHistory(
    userId: string,
    format: 'json' | 'csv' = 'json',
    dateRange?: { start: Date; end: Date }
  ): Promise<string> {
    try {
      let conditions = [
        eq(schema.paymentTransactions.userId, userId),
        isNull(schema.paymentTransactions.deletedAt)
      ];

      if (dateRange) {
        conditions.push(
          sql`${schema.paymentTransactions.createdAt} >= ${dateRange.start}`,
          sql`${schema.paymentTransactions.createdAt} <= ${dateRange.end}`
        );
      }

      const transactions = await this.db
        .select({
          transaction: schema.paymentTransactions,
          order: {
            id: schema.orders.id,
            total: schema.orders.total,
            status: schema.orders.status,
          }
        })
        .from(schema.paymentTransactions)
        .innerJoin(schema.orders, eq(schema.paymentTransactions.orderId, schema.orders.id))
        .where(and(...conditions))
        .orderBy(desc(schema.paymentTransactions.createdAt));

      if (format === 'csv') {
        const headers = [
          'Transaction ID', 'Order ID', 'Payment Method', 'Amount', 'Currency',
          'Status', 'Created At', 'Processed At', 'Order Total'
        ];
        
        const csvRows = [
          headers.join(','),
          ...transactions.map(t => [
            t.transaction.id,
            t.order.id,
            t.transaction.paymentMethod,
            t.transaction.amount.toString(),
            t.transaction.currency,
            t.transaction.status,
            t.transaction.createdAt.toISOString(),
            t.transaction.processedAt?.toISOString() || '',
            t.order.total.toString()
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          userId,
          dateRange,
          totalTransactions: transactions.length,
          transactions: transactions.map(t => ({
            id: t.transaction.id,
            orderId: t.order.id,
            paymentMethod: t.transaction.paymentMethod,
            amount: t.transaction.amount,
            currency: t.transaction.currency,
            status: t.transaction.status,
            createdAt: t.transaction.createdAt,
            processedAt: t.transaction.processedAt,
            gatewayTransactionId: t.transaction.gatewayTransactionId,
            orderTotal: t.order.total
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error('Failed to export payment history:', error);
      throw error;
    }
  }

  async handleWebhook(
    provider: 'stripe' | 'paypal',
    signature: string,
    payload: string
  ): Promise<void> {
    try {
      switch (provider) {
        case 'stripe':
          await paymentGatewayService.handleStripeWebhook(signature, payload);
          break;
        case 'paypal':
          // Handle PayPal webhook
          await this.handlePayPalWebhook(payload);
          break;
        default:
          throw new Error(`Unsupported webhook provider: ${provider}`);
      }
    } catch (error) {
      console.error('Failed to handle webhook:', error);
      throw error;
    }
  }

  private async handlePayPalWebhook(payload: string): Promise<void> {
    try {
      const event = JSON.parse(payload);
      
      switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.confirmPayment(event.resource.id, event.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.failPayment(event.resource.id, 'Payment denied', event.resource);
          break;
        default:
          console.log(`Unhandled PayPal webhook event: ${event.event_type}`);
      }
    } catch (error) {
      console.error('Failed to handle PayPal webhook:', error);
    }
  }
}

export const paymentService = new PaymentService();
