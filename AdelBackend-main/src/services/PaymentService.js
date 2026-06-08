import Stripe from 'stripe';
import PaymentRepository from '../repositories/PaymentRepository.js';
import EventRepository from '../repositories/EventRepository.js';
import InscriptionRepository from '../repositories/InscriptionRepository.js';
import InscriptionService from './InscriptionService.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { sendPaymentConfirmation } from '../utils/email.util.js';
import logger from '../config/logger.js';

// Lazy Stripe instance — initialized on first use so dotenv is already loaded
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    console.log('[Stripe init] key present:', !!key, '| starts with sk_:', key?.startsWith('sk_'));
    if (key && key.startsWith('sk_')) {
      _stripe = new Stripe(key);
      console.log('[Stripe init] SUCCESS');
    } else {
      console.error('[Stripe init] FAILED — missing or invalid key');
    }
  }
  return _stripe;
}

class PaymentService {
  /**
   * Initialize payment for event registration
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Object} Payment details
   */
  async initializePayment(eventId, userId) {
    // Get event
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    if (event.status !== 'PUBLISHED') {
      throw ApiError.badRequest('Event is not available', 'EVENT_NOT_AVAILABLE');
    }

    if (event.isFree()) {
      throw ApiError.badRequest('This event is free', 'EVENT_IS_FREE');
    }

    // Check if user has pending/confirmed inscription
    let inscription = await InscriptionRepository.findByEventAndUser(eventId, userId);
    
    if (inscription && inscription.status === 'CONFIRMED') {
      throw ApiError.badRequest('Already registered for this event', 'ALREADY_REGISTERED');
    }

    // Create inscription if not exists
    if (!inscription) {
      inscription = await InscriptionRepository.create({
        eventId,
        userId,
        status: 'PENDING',
      });
      await EventRepository.incrementParticipants(eventId);
    }

    // Check for existing pending payment
    const existingPayment = await PaymentRepository.findByInscription(inscription.id);
    if (existingPayment && existingPayment.status === 'PENDING') {
      // If Stripe is now available but the existing payment has no clientSecret, create a new PaymentIntent
      const existingSecret = existingPayment.metadata?.clientSecret || null;
      if (!existingSecret && getStripe()) {
        const paymentIntent = await getStripe().paymentIntents.create({
          amount: Math.round(parseFloat(existingPayment.amount) * 100),
          currency: existingPayment.currency.toLowerCase(),
          metadata: { paymentId: existingPayment.id, eventId, userId },
        });
        await PaymentRepository.update(existingPayment.id, {
          provider_payment_id: paymentIntent.id,
          metadata: { clientSecret: paymentIntent.client_secret },
        });
        return {
          paymentId: existingPayment.id,
          amount: parseFloat(existingPayment.amount),
          currency: existingPayment.currency,
          clientSecret: paymentIntent.client_secret,
          status: existingPayment.status,
        };
      }
      if (!existingSecret) {
        throw ApiError.internal('Payment initialization failed', 'PAYMENT_INIT_FAILED');
      }
      return {
        paymentId: existingPayment.id,
        amount: parseFloat(existingPayment.amount),
        currency: existingPayment.currency,
        clientSecret: existingSecret,
        status: existingPayment.status,
      };
    }

    // Create payment record
    const payment = await PaymentRepository.create({
      userId,
      eventId,
      inscriptionId: inscription.id,
      amount: event.price,
      currency: event.currency,
      provider: getStripe() ? 'stripe' : 'mock',
      status: 'PENDING',
    });

    let clientSecret = null;

    // If Stripe is configured, create payment intent
    if (getStripe()) {
      try {
        const paymentIntent = await getStripe().paymentIntents.create({
          amount: Math.round(event.price * 100), // Convert to cents
          currency: event.currency.toLowerCase(),
          metadata: {
            paymentId: payment.id,
            eventId: event.id,
            userId: userId,
          },
        });

        await PaymentRepository.update(payment.id, {
          provider_payment_id: paymentIntent.id,
          metadata: { clientSecret: paymentIntent.client_secret },
        });

        clientSecret = paymentIntent.client_secret;
      } catch (error) {
        logger.error('Stripe payment intent creation failed:', error.message, error.type, error.code);
        throw ApiError.internal(`Stripe error: ${error.message}`, 'PAYMENT_INIT_FAILED');
      }
    }

    logger.info(`Payment initialized: ${payment.id} for event ${eventId}`);

    return {
      paymentId: payment.id,
      amount: parseFloat(event.price),
      currency: event.currency,
      clientSecret,
      status: payment.status,
    };
  }

  /**
   * Process mock payment (for testing)
   * @param {string} paymentId - Payment ID
   * @param {Object} paymentDetails - Mock payment details
   */
  async processMockPayment(paymentId, paymentDetails = {}) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      throw ApiError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'PENDING') {
      throw ApiError.badRequest('Payment is not pending', 'PAYMENT_NOT_PENDING');
    }

    // Simulate payment processing
    const success = paymentDetails.simulateFailure !== true;

    if (success) {
      await PaymentRepository.update(paymentId, {
        status: 'PAID',
        provider_payment_id: `mock_${Date.now()}`,
      });

      // Confirm inscription
      if (payment.inscription_id) {
        await InscriptionService.confirmInscription(payment.inscription_id);
      }

      // Send confirmation
      const event = await EventRepository.findById(payment.event_id);
      const inscription = await InscriptionRepository.findById(payment.inscription_id);
      if (inscription && inscription.user) {
        await sendPaymentConfirmation(inscription.user.email, payment, event);
      }

      logger.info(`Mock payment completed: ${paymentId}`);
      return { status: 'PAID', message: 'Payment successful' };
    } else {
      await PaymentRepository.update(paymentId, { status: 'FAILED' });
      logger.info(`Mock payment failed: ${paymentId}`);
      return { status: 'FAILED', message: 'Payment failed' };
    }
  }

  /**
   * Handle Stripe webhook
   * @param {Object} event - Stripe webhook event
   */
  async handleStripeWebhook(event) {
    const { type, data } = event;

    switch (type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = data.object;
      const paymentId = paymentIntent.metadata?.paymentId;

      if (paymentId) {
        const payment = await PaymentRepository.findById(paymentId);
        if (payment && payment.status === 'PENDING') {
          await PaymentRepository.update(paymentId, { status: 'PAID' });

          if (payment.inscription_id) {
            await InscriptionService.confirmInscription(payment.inscription_id);
          }

          const eventRecord = await EventRepository.findById(payment.event_id);
          const inscription = await InscriptionRepository.findById(payment.inscription_id);
          if (inscription && inscription.user) {
            await sendPaymentConfirmation(inscription.user.email, payment, eventRecord);
          }

          logger.info(`Stripe payment succeeded: ${paymentId}`);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = data.object;
      const paymentId = paymentIntent.metadata?.paymentId;

      if (paymentId) {
        await PaymentRepository.update(paymentId, { status: 'FAILED' });
        logger.info(`Stripe payment failed: ${paymentId}`);
      }
      break;
    }

    default:
      logger.info(`Unhandled Stripe event type: ${type}`);
    }

    return { received: true };
  }

  /**
   * Confirm payment after Stripe succeeds on the frontend (no webhook needed)
   * @param {string} paymentId - Our internal payment ID
   * @param {string} stripePaymentIntentId - Stripe's PaymentIntent ID
   */
  async confirmFromStripe(paymentId, stripePaymentIntentId) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      throw ApiError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.status === 'PAID') {
      return { status: 'PAID', message: 'Already confirmed' };
    }

    // Verify with Stripe that the PaymentIntent actually succeeded
    if (getStripe()) {
      const paymentIntent = await getStripe().paymentIntents.retrieve(stripePaymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        throw ApiError.badRequest('Payment not completed on Stripe', 'PAYMENT_NOT_COMPLETED');
      }
    }

    await PaymentRepository.update(paymentId, {
      status: 'PAID',
      provider_payment_id: stripePaymentIntentId,
    });

    if (payment.inscription_id) {
      await InscriptionService.confirmInscription(payment.inscription_id);
    }

    const eventRecord = await EventRepository.findById(payment.event_id);
    const inscription = await InscriptionRepository.findById(payment.inscription_id);
    if (inscription && inscription.user) {
      await sendPaymentConfirmation(inscription.user.email, payment, eventRecord);
    }

    logger.info(`Payment confirmed from Stripe frontend: ${paymentId}`);
    return { status: 'PAID', message: 'Payment confirmed and inscription validated' };
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID
   */
  async getPaymentStatus(paymentId) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      throw ApiError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    return payment.toPublicJSON();
  }

  /**
   * Get user's payments
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  async getUserPayments(userId, options = {}) {
    return PaymentRepository.findByUserId(userId, options);
  }

  /**
   * Request refund
   * @param {string} paymentId - Payment ID
   * @param {string} userId - User ID
   */
  async requestRefund(paymentId, userId) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      throw ApiError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.user_id !== userId) {
      throw ApiError.forbidden('You do not own this payment', 'NOT_OWNER');
    }

    if (!payment.canBeRefunded()) {
      throw ApiError.badRequest('Payment cannot be refunded', 'CANNOT_REFUND');
    }

    // Process refund with Stripe if configured
    if (getStripe() && payment.provider_payment_id) {
      try {
        await getStripe().refunds.create({
          payment_intent: payment.provider_payment_id,
        });
      } catch (error) {
        logger.error('Stripe refund failed:', error);
        throw ApiError.internal('Refund processing failed', 'REFUND_FAILED');
      }
    }

    await PaymentRepository.update(paymentId, {
      status: 'REFUNDED',
      refunded_at: new Date(),
    });

    // Cancel inscription
    if (payment.inscription_id) {
      await InscriptionRepository.update(payment.inscription_id, { status: 'CANCELLED' });
      await EventRepository.decrementParticipants(payment.event_id);
    }

    logger.info(`Payment refunded: ${paymentId}`);
    return { message: 'Refund processed successfully' };
  }
}

export default new PaymentService();

