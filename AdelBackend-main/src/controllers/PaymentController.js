import PaymentService from '../services/PaymentService.js';
import logger from '../config/logger.js';

class PaymentController {
  /**
   * Initialize payment for event
   * POST /api/events/:id/payments
   */
  async initializePayment(req, res, next) {
    try {
      const { id: eventId } = req.params;

      const result = await PaymentService.initializePayment(eventId, req.userId);

      res.status(201).json({
        message: 'Payment initialized',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process mock payment (for testing)
   * POST /api/payments/:id/mock
   */
  async processMockPayment(req, res, next) {
    try {
      const { id: paymentId } = req.params;
      const { simulateFailure } = req.body;

      const result = await PaymentService.processMockPayment(paymentId, {
        simulateFailure,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Stripe webhook
   * POST /api/payments/webhook
   */
  async handleWebhook(req, res, next) {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      // If Stripe is configured, verify webhook signature
      if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET,
          );
        } catch (err) {
          logger.error('Webhook signature verification failed:', err.message);
          return res.status(400).json({
            error: 'Webhook signature verification failed',
            code: 'WEBHOOK_ERROR',
          });
        }
      } else {
        // For testing without Stripe, accept raw event
        event = req.body;
      }

      const result = await PaymentService.handleStripeWebhook(event);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment status
   * GET /api/payments/:id/status
   */
  async getPaymentStatus(req, res, next) {
    try {
      const { id: paymentId } = req.params;

      const payment = await PaymentService.getPaymentStatus(paymentId);
      res.json({ payment });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's payments
   * GET /api/users/me/payments
   */
  async getUserPayments(req, res, next) {
    try {
      const { page, limit, status, sortBy, sortOrder } = req.query;

      const result = await PaymentService.getUserPayments(req.userId, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        status,
        sortBy,
        sortOrder,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request refund
   * POST /api/payments/:id/refund
   */
  async requestRefund(req, res, next) {
    try {
      const { id: paymentId } = req.params;

      const result = await PaymentService.requestRefund(paymentId, req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();

