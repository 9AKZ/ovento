import InscriptionRepository from '../repositories/InscriptionRepository.js';
import EventRepository from '../repositories/EventRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import PaymentRepository from '../repositories/PaymentRepository.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { sendRegistrationConfirmation } from '../utils/email.util.js';
import logger from '../config/logger.js';

class InscriptionService {
  /**
   * Register for an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Object} Inscription
   */
  async registerForEvent(eventId, userId) {
    // Get event
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Check event is published
    if (event.status !== 'PUBLISHED') {
      throw ApiError.badRequest('Event is not available for registration', 'EVENT_NOT_AVAILABLE');
    }

    // Check capacity
    if (!event.hasCapacity()) {
      throw ApiError.badRequest('Event is full', 'EVENT_FULL');
    }

    // Check if user is already registered
    const existingInscription = await InscriptionRepository.findByEventAndUser(eventId, userId);
    if (existingInscription) {
      if (existingInscription.status === 'CANCELLED') {
        // Reactivate inscription
        const reactivated = await InscriptionRepository.update(existingInscription.id, {
          status: event.isFree() ? 'CONFIRMED' : 'PENDING',
        });
        await EventRepository.incrementParticipants(eventId);
        return reactivated.toPublicJSON();
      }
      // Return special response for already registered
      return {
        alreadyJoined: true,
        id: eventId,
        message: 'Already registered for this event',
      };
    }

    // Create inscription
    const inscription = await InscriptionRepository.create({
      eventId,
      userId,
      status: event.isFree() ? 'CONFIRMED' : 'PENDING',
    });

    // Increment participant count
    await EventRepository.incrementParticipants(eventId);

    // Send confirmation email for free events
    if (event.isFree()) {
      const user = await inscription.getUser();
      if (user) {
        await sendRegistrationConfirmation(user.email, event, inscription);
      }
    }

    logger.info(`User ${userId} registered for event ${eventId}`);
    return inscription.toPublicJSON();
  }

  /**
   * Cancel inscription
   * @param {string} inscriptionId - Inscription ID
   * @param {string} userId - User ID
   */
  async cancelInscription(inscriptionId, userId) {
    const inscription = await InscriptionRepository.findById(inscriptionId);
    if (!inscription) {
      throw ApiError.notFound('Inscription not found', 'INSCRIPTION_NOT_FOUND');
    }

    // Check ownership or admin rights
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (inscription.user_id !== userId && user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this inscription', 'NOT_OWNER');
    }

    // Check if can be cancelled
    if (!inscription.canBeCancelled()) {
      throw ApiError.badRequest('Inscription is already cancelled', 'ALREADY_CANCELLED');
    }

    // Update inscription
    await InscriptionRepository.update(inscriptionId, { status: 'CANCELLED' });

    // Decrement participant count
    await EventRepository.decrementParticipants(inscription.event_id);

    // Handle refund if payment exists
    const payment = await PaymentRepository.findByInscription(inscriptionId);
    if (payment && payment.status === 'PAID') {
      // In a real app, process refund here
      await PaymentRepository.update(payment.id, {
        status: 'REFUNDED',
        refunded_at: new Date(),
      });
      logger.info(`Payment refunded for inscription ${inscriptionId}`);
    }

    logger.info(`Inscription cancelled: ${inscriptionId}`);
    return { message: 'Inscription cancelled successfully' };
  }

  /**
   * Get user's inscriptions
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  async getUserInscriptions(userId, options = {}) {
    const result = await InscriptionRepository.findByUserId(userId, options);
    
    return {
      inscriptions: result.inscriptions.map((i) => ({
        ...i.toPublicJSON(),
        event: i.event ? {
          id: i.event.id,
          title: i.event.title,
          startDatetime: i.event.start_datetime,
          endDatetime: i.event.end_datetime,
          location: i.event.location,
          status: i.event.status,
          imageUrl: i.event.image_url,
        } : null,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get event inscriptions (organizer)
   * @param {string} eventId - Event ID
   * @param {string} userId - Requesting user ID
   * @param {Object} options - Query options
   */
  async getEventInscriptions(eventId, userId, options = {}) {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Check if user is organizer or admin
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (event.organizer_id !== userId && user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    const result = await InscriptionRepository.findByEventId(eventId, options);

    return {
      inscriptions: result.map((i) => ({
        ...i.toPublicJSON(),
        user: i.user ? {
          id: i.user.id,
          fullName: i.user.full_name,
          email: i.user.email,
          avatarUrl: i.user.avatar_url,
        } : null,
      })),
      total: result.length,
    };
  }

  /**
   * Confirm inscription (after payment)
   * @param {string} inscriptionId - Inscription ID
   */
  async confirmInscription(inscriptionId) {
    const inscription = await InscriptionRepository.findById(inscriptionId);
    if (!inscription) {
      throw ApiError.notFound('Inscription not found', 'INSCRIPTION_NOT_FOUND');
    }

    if (inscription.status === 'CONFIRMED') {
      return inscription.toPublicJSON();
    }

    const updated = await InscriptionRepository.update(inscriptionId, { status: 'CONFIRMED' });

    // Send confirmation email
    if (inscription.user && inscription.event) {
      await sendRegistrationConfirmation(
        inscription.user.email,
        inscription.event,
        inscription,
      );
    }

    logger.info(`Inscription confirmed: ${inscriptionId}`);
    return updated.toPublicJSON();
  }

  /**
   * Get inscription by ID
   * @param {string} inscriptionId - Inscription ID
   */
  async getInscription(inscriptionId) {
    const inscription = await InscriptionRepository.findById(inscriptionId);
    if (!inscription) {
      throw ApiError.notFound('Inscription not found', 'INSCRIPTION_NOT_FOUND');
    }
    return inscription.toPublicJSON();
  }

  /**
   * Leave event (cancel inscription by event ID)
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   */
  async leaveEvent(eventId, userId) {
    // Find the user's inscription for this event
    const inscription = await InscriptionRepository.findByEventAndUser(eventId, userId);
    if (!inscription) {
      throw ApiError.notFound('Inscription not found', 'INSCRIPTION_NOT_FOUND');
    }

    // Check if can be cancelled
    if (!inscription.canBeCancelled()) {
      throw ApiError.badRequest('Inscription is already cancelled', 'ALREADY_CANCELLED');
    }

    // Update inscription
    await InscriptionRepository.update(inscription.id, { status: 'CANCELLED' });

    // Decrement participant count
    await EventRepository.decrementParticipants(eventId);

    // Handle refund if payment exists
    const payment = await PaymentRepository.findByInscription(inscription.id);
    if (payment && payment.status === 'PAID') {
      // In a real app, process refund here
      await PaymentRepository.update(payment.id, {
        status: 'REFUNDED',
        refunded_at: new Date(),
      });
      logger.info(`Payment refunded for inscription ${inscription.id}`);
    }

    logger.info(`User ${userId} left event ${eventId}`);
    return { message: 'Successfully left the event' };
  }
}

export default new InscriptionService();

