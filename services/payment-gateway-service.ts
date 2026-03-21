import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, isNull } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface PaymentGatewayConfig {
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    sandbox: boolean;
  };
}

export interface PaymentIntent {
  id: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  provider: string;
  providerMethodId: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  metadata?: any;
}

export class PaymentGatewayService {
  private db: ReturnType<typeof drizzle>;
  private config: PaymentGatewayConfig;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });

    this.config = {
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        sandbox: process.env.PAYPAL_SANDBOX === 'true',
      }
    };
  }

  // Stripe Integration
  async createStripePaymentIntent(
    amount: number,
    currency: string = 'UZS',
    orderId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    try {
      // Convert to cents for Stripe
      const amountInCents = Math.round(amount * 100);

      // In a real implementation, you would use the Stripe SDK
      // const stripe = require('stripe')(this.config.stripe.secretKey);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: amountInCents,
      //   currency: currency.toLowerCase(),
      //   metadata: { orderId, userId, ...metadata },
      //   automatic_payment_methods: { enabled: true },
      // });

      // Mock response for demonstration
      const paymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency,
        status: 'requires_payment_method',
        metadata: { orderId, userId, ...metadata }
      };

      // Store payment transaction
      await this.db.insert(schema.paymentTransactions).values({
        id: paymentIntent.id,
        orderId,
        userId,
        paymentMethod: 'stripe',
        amount,
        currency,
        status: 'pending',
        gatewayTransactionId: paymentIntent.id,
        gatewayResponse: paymentIntent,
        metadata: metadata || {},
      });

      return paymentIntent;
    } catch (error) {
      console.error('Failed to create Stripe payment intent:', error);
      throw error;
    }
  }

  async confirmStripePayment(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      // In a real implementation:
      // const stripe = require('stripe')(this.config.stripe.secretKey);
      // const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

      // Mock confirmation
      const paymentIntent: PaymentIntent = {
        id: paymentIntentId,
        amount: 10000,
        currency: 'UZS',
        status: 'succeeded',
      };

      // Update transaction status
      await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'completed',
          processedAt: new Date(),
          gatewayResponse: paymentIntent,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.gatewayTransactionId, paymentIntentId));

      return paymentIntent;
    } catch (error) {
      console.error('Failed to confirm Stripe payment:', error);
      throw error;
    }
  }

  async cancelStripePayment(paymentIntentId: string): Promise<void> {
    try {
      // In a real implementation:
      // const stripe = require('stripe')(this.config.stripe.secretKey);
      // await stripe.paymentIntents.cancel(paymentIntentId);

      // Update transaction status
      await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.gatewayTransactionId, paymentIntentId));
    } catch (error) {
      console.error('Failed to cancel Stripe payment:', error);
      throw error;
    }
  }

  // PayPal Integration
  async createPayPalOrder(
    amount: number,
    currency: string = 'UZS',
    orderId: string,
    userId: string
  ): Promise<any> {
    try {
      // In a real implementation, you would use PayPal SDK
      // const paypal = require('@paypal/checkout-server-sdk');
      // const request = new paypal.orders.OrdersCreateRequest();
      // request.requestBody({
      //   intent: 'CAPTURE',
      //   purchase_units: [{
      //     amount: { currency_code: currency, value: amount.toString() },
      //     reference_id: orderId,
      //     custom_id: userId,
      //   }],
      // });
      // const order = await paypalClient().execute(request);

      // Mock response
      const paypalOrder = {
        id: `PAYPAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'CREATED',
        links: [
          {
            href: `https://api.sandbox.paypal.com/v2/checkout/orders/${paypalOrder.id}`,
            rel: 'self',
            method: 'GET'
          },
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrder.id}`,
            rel: 'approve',
            method: 'GET'
          }
        ]
      };

      // Store payment transaction
      await this.db.insert(schema.paymentTransactions).values({
        id: paypalOrder.id,
        orderId,
        userId,
        paymentMethod: 'paypal',
        amount,
        currency,
        status: 'pending',
        gatewayTransactionId: paypalOrder.id,
        gatewayResponse: paypalOrder,
      });

      return paypalOrder;
    } catch (error) {
      console.error('Failed to create PayPal order:', error);
      throw error;
    }
  }

  async capturePayPalPayment(orderId: string): Promise<any> {
    try {
      // In a real implementation:
      // const paypal = require('@paypal/checkout-server-sdk');
      // const request = new paypal.orders.OrdersCaptureRequest(orderId);
      // const capture = await paypalClient().execute(request);

      // Mock capture
      const captureResult = {
        id: orderId,
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{
              id: `CAPTURE-${Date.now()}`,
              status: 'COMPLETED',
              amount: { currency_code: 'UZS', value: '10000' }
            }]
          }
        }]
      };

      // Update transaction status
      await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'completed',
          processedAt: new Date(),
          gatewayResponse: captureResult,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.gatewayTransactionId, orderId));

      return captureResult;
    } catch (error) {
      console.error('Failed to capture PayPal payment:', error);
      throw error;
    }
  }

  // Payment Methods Management
  async addPaymentMethod(
    userId: string,
    paymentMethodData: {
      type: 'card' | 'bank_account' | 'digital_wallet';
      provider: string;
      providerMethodId: string;
      brand?: string;
      last4?: string;
      expiryMonth?: number;
      expiryYear?: number;
      isDefault?: boolean;
      metadata?: any;
    }
  ): Promise<PaymentMethod> {
    try {
      // If setting as default, unset other default methods
      if (paymentMethodData.isDefault) {
        await this.db
          .update(schema.paymentMethods)
          .set({ isDefault: false })
          .where(and(
            eq(schema.paymentMethods.userId, userId),
            eq(schema.paymentMethods.isDefault, true)
          ));
      }

      const result = await this.db
        .insert(schema.paymentMethods)
        .values({
          userId,
          type: paymentMethodData.type,
          provider: paymentMethodData.provider,
          providerMethodId: paymentMethodData.providerMethodId,
          brand: paymentMethodData.brand,
          last4: paymentMethodData.last4,
          expiryMonth: paymentMethodData.expiryMonth,
          expiryYear: paymentMethodData.expiryYear,
          isDefault: paymentMethodData.isDefault || false,
          isActive: true,
          metadata: paymentMethodData.metadata || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw error;
    }
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const methods = await this.db
        .select()
        .from(schema.paymentMethods)
        .where(and(
          eq(schema.paymentMethods.userId, userId),
          eq(schema.paymentMethods.isActive, true)
        ))
        .orderBy(desc(schema.paymentMethods.isDefault), desc(schema.paymentMethods.createdAt));

      return methods;
    } catch (error) {
      console.error('Failed to get user payment methods:', error);
      throw error;
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      // Verify ownership
      const method = await this.db
        .select()
        .from(schema.paymentMethods)
        .where(and(
          eq(schema.paymentMethods.id, paymentMethodId),
          eq(schema.paymentMethods.userId, userId)
        ))
        .limit(1);

      if (!method[0]) {
        throw new Error('Payment method not found');
      }

      // Soft delete
      await this.db
        .update(schema.paymentMethods)
        .set({ isActive: false })
        .where(eq(schema.paymentMethods.id, paymentMethodId));
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      // Unset all other defaults
      await this.db
        .update(schema.paymentMethods)
        .set({ isDefault: false })
        .where(eq(schema.paymentMethods.userId, userId));

      // Set new default
      await this.db
        .update(schema.paymentMethods)
        .set({ isDefault: true })
        .where(and(
          eq(schema.paymentMethods.id, paymentMethodId),
          eq(schema.paymentMethods.userId, userId)
        ));
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      throw error;
    }
  }

  // Cash on Delivery
  async createCashOnDeliveryTransaction(
    orderId: string,
    userId: string,
    amount: number
  ): Promise<schema.PaymentTransaction> {
    try {
      const result = await this.db
        .insert(schema.paymentTransactions)
        .values({
          orderId,
          userId,
          paymentMethod: 'cash_on_delivery',
          amount,
          currency: 'UZS',
          status: 'pending',
          metadata: { paymentType: 'cash_on_delivery' },
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Failed to create cash on delivery transaction:', error);
      throw error;
    }
  }

  async confirmCashOnDeliveryPayment(transactionId: string): Promise<void> {
    try {
      await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'completed',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.id, transactionId));
    } catch (error) {
      console.error('Failed to confirm cash on delivery payment:', error);
      throw error;
    }
  }

  // Payment Processing
  async processPayment(
    orderId: string,
    userId: string,
    paymentMethod: string,
    amount: number,
    paymentMethodId?: string
  ): Promise<schema.PaymentTransaction> {
    try {
      switch (paymentMethod) {
        case 'stripe':
          if (!paymentMethodId) {
            throw new Error('Payment method ID required for Stripe');
          }
          return await this.processStripePayment(orderId, userId, amount, paymentMethodId);
        
        case 'paypal':
          return await this.createPayPalOrder(amount, 'UZS', orderId, userId);
        
        case 'cash_on_delivery':
          return await this.createCashOnDeliveryTransaction(orderId, userId, amount);
        
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    }
  }

  private async processStripePayment(
    orderId: string,
    userId: string,
    amount: number,
    paymentMethodId: string
  ): Promise<schema.PaymentTransaction> {
    try {
      const paymentIntent = await this.createStripePaymentIntent(amount, 'UZS', orderId, userId);
      
      // In a real implementation, you would attach the payment method to the intent
      // const stripe = require('stripe')(this.config.stripe.secretKey);
      // await stripe.paymentIntents.update(paymentIntent.id, {
      //   payment_method: paymentMethodId,
      //   confirm: true,
      // });

      return await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.gatewayTransactionId, paymentIntent.id))
        .limit(1)
        .then(result => result[0]);
    } catch (error) {
      console.error('Failed to process Stripe payment:', error);
      throw error;
    }
  }

  // Payment Status Check
  async getPaymentStatus(transactionId: string): Promise<schema.PaymentTransaction | null> {
    try {
      const transaction = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.id, transactionId))
        .limit(1);

      return transaction[0] || null;
    } catch (error) {
      console.error('Failed to get payment status:', error);
      return null;
    }
  }

  // Webhook Handling
  async handleStripeWebhook(signature: string, payload: string): Promise<void> {
    try {
      // In a real implementation, you would verify the webhook signature
      // const stripe = require('stripe')(this.config.stripe.secretKey);
      // const event = stripe.webhooks.constructEvent(payload, signature, this.config.stripe.webhookSecret);

      const event = JSON.parse(payload);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailure(event.data.object);
          break;
        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to handle Stripe webhook:', error);
      throw error;
    }
  }

  private async handleStripePaymentSuccess(paymentIntent: any): Promise<void> {
    try {
      await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'completed',
          processedAt: new Date(),
          gatewayResponse: paymentIntent,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.gatewayTransactionId, paymentIntent.id));
    } catch (error) {
      console.error('Failed to handle Stripe payment success:', error);
    }
  }

  private async handleStripePaymentFailure(paymentIntent: any): Promise<void> {
    try {
      await this.db
        .update(schema.paymentTransactions)
        .set({
          status: 'failed',
          gatewayError: paymentIntent.last_payment_error?.message,
          gatewayResponse: paymentIntent,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentTransactions.gatewayTransactionId, paymentIntent.id));
    } catch (error) {
      console.error('Failed to handle Stripe payment failure:', error);
    }
  }
}

export const paymentGatewayService = new PaymentGatewayService();
