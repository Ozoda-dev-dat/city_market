import { Request, Response } from 'express';
import { paymentService } from '../services/payment-service';
import { paymentGatewayService } from '../services/payment-gateway-service';

export class PaymentWebhooks {
  static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      // Verify webhook signature
      if (!signature) {
        res.status(400).json({ error: 'Missing Stripe signature' });
        return;
      }

      // Process webhook
      await paymentGatewayService.handleStripeWebhook(signature, JSON.stringify(payload));

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async handlePayPalWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = JSON.stringify(req.body);
      
      // Process PayPal webhook
      await paymentService.handleWebhook('paypal', '', payload);

      res.json({ received: true });
    } catch (error) {
      console.error('PayPal webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async handleGenericWebhook(req: Request, res: Response): Promise<void> {
    try {
      const provider = req.params.provider as string;
      const signature = req.headers['x-signature'] as string;
      const payload = JSON.stringify(req.body);

      // Validate provider
      if (!['stripe', 'paypal'].includes(provider)) {
        res.status(400).json({ error: 'Unsupported provider' });
        return;
      }

      // Process webhook
      await paymentService.handleWebhook(provider as any, signature, payload);

      res.json({ received: true });
    } catch (error) {
      console.error('Generic webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

export default PaymentWebhooks;
