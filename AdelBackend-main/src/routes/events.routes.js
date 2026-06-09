import { Router } from 'express';
import EventController from '../controllers/EventController.js';
import InscriptionController from '../controllers/InscriptionController.js';
import PaymentController from '../controllers/PaymentController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireOrganizer } from '../middlewares/role.middleware.js';
import { uploadSingle } from '../middlewares/upload.middleware.js';
import { eventCreationLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  getEventSchema,
  listEventsSchema,
  publishEventSchema,
  deleteEventSchema,
} from '../validators/event.validator.js';

const router = Router();

/**
 * @route GET /api/events
 * @desc List events
 * @access Public (optionalAuth for organizer filtering)
 */
router.get(
  '/',
  optionalAuth,
  validate(listEventsSchema),
  EventController.listEvents,
);

/**
 * @route GET /api/events/my-events
 * @desc Get organizer's events
 * @access Private/Organizer
 */
router.get(
  '/my-events',
  authenticate,
  EventController.getMyEvents,
);

/**
 * @route POST /api/events
 * @desc Create new event
 * @access Private
 */
router.post(
  '/',
  authenticate,
  eventCreationLimiter,
  uploadSingle('image'),
  validate(createEventSchema),
  EventController.createEvent,
);

/**
 * @route GET /api/events/:id
 * @desc Get event by ID
 * @access Public (optionalAuth for unpublished events)
 */
router.get(
  '/:id',
  optionalAuth,
  validate(getEventSchema),
  EventController.getEvent,
);

/**
 * @route PATCH /api/events/:id
 * @desc Update event
 * @access Private/Owner
 */
router.patch(
  '/:id',
  authenticate,
  validate(updateEventSchema),
  EventController.updateEvent,
);

/**
 * @route DELETE /api/events/:id
 * @desc Delete event
 * @access Private/Owner
 */
router.delete(
  '/:id',
  authenticate,
  validate(deleteEventSchema),
  EventController.deleteEvent,
);

/**
 * @route POST /api/events/:id/publish
 * @desc Publish event
 * @access Private/Owner
 */
router.post(
  '/:id/publish',
  authenticate,
  validate(publishEventSchema),
  EventController.publishEvent,
);

/**
 * @route POST /api/events/:id/unpublish
 * @desc Unpublish event
 * @access Private/Owner
 */
router.post(
  '/:id/unpublish',
  authenticate,
  validate(publishEventSchema),
  EventController.unpublishEvent,
);

/**
 * @route POST /api/events/:id/cancel
 * @desc Cancel event
 * @access Private/Owner
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate(publishEventSchema),
  EventController.cancelEvent,
);

/**
 * @route POST /api/events/:id/image
 * @desc Upload event image
 * @access Private/Owner
 */
router.post(
  '/:id/image',
  authenticate,
  uploadSingle('image'),
  EventController.uploadImage,
);

/**
 * @route POST /api/events/:id/inscriptions
 * @desc Register for event
 * @access Private
 */
router.post(
  '/:id/inscriptions',
  authenticate,
  validate(getEventSchema),
  InscriptionController.registerForEvent,
);

/**
 * @route GET /api/events/:id/inscriptions
 * @desc Get event inscriptions (organizer only)
 * @access Private/Owner
 */
router.get(
  '/:id/inscriptions',
  authenticate,
  validate(getEventSchema),
  InscriptionController.getEventInscriptions,
);

/**
 * @route DELETE /api/events/:id/inscriptions
 * @desc Leave event (cancel inscription)
 * @access Private
 */
router.delete(
  '/:id/inscriptions',
  authenticate,
  validate(getEventSchema),
  InscriptionController.leaveEvent,
);

/**
 * @route POST /api/events/:id/payments
 * @desc Initialize payment for event
 * @access Private
 */
router.post(
  '/:id/payments',
  authenticate,
  validate(getEventSchema),
  PaymentController.initializePayment,
);

export default router;

