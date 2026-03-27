import { Router } from 'express';
import express from 'express';
import PaymentController from '../controllers/PaymentController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { paymentIdSchema } from '../validators/payment.validator.js';

const router = Router();

/**
 * @route POST /api/payments/webhook
 * @desc Handle Stripe webhook
 * @access Public (Stripe)
 * Note: This route needs raw body for signature verification
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook,
);

// Routes below require authentication
router.use(authenticate);

/**
 * @route GET /api/payments/:id/status
 * @desc Get payment status
 * @access Private
 */
router.get(
  '/:id/status',
  validate(paymentIdSchema),
  PaymentController.getPaymentStatus,
);

/**
 * @route POST /api/payments/:id/mock
 * @desc Process mock payment (testing only)
 * @access Private
 */
router.post(
  '/:id/mock',
  validate(paymentIdSchema),
  PaymentController.processMockPayment,
);

/**
 * @route POST /api/payments/:id/refund
 * @desc Request refund
 * @access Private/Owner
 */
router.post(
  '/:id/refund',
  validate(paymentIdSchema),
  PaymentController.requestRefund,
);

export default router;

