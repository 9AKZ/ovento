import EventRepository from '../repositories/EventRepository.js';
import InscriptionRepository from '../repositories/InscriptionRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import Inscription from '../models/Inscription.js';
import logger from '../config/logger.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { sendEventCancellationNotification } from '../utils/email.util.js';
import { Op } from 'sequelize';

class EventService {
  /**
     * Create a new event
     * @param {Object} eventData - Event data
     * @param {string} organizerId - Organizer user ID
     * @returns {Object} Created event
     */
  async createEvent(eventData, organizerId) {
    const event = await EventRepository.create({
      ...eventData,
      organizerId,
      status: eventData.status || 'DRAFT',
    });

    logger.info(`Event created: ${event.id} by organizer ${organizerId}`);
    return event.toPublicJSON();
  }

  /**
     * Get event by ID
     * @param {string} eventId - Event ID
     * @param {string} userId - Optional requesting user ID
     */
  async getEvent(eventId, userId = null, userRole = 'USER') {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // If event is not published, only organizer/admin can see it
    if (event.status !== 'PUBLISHED') {
      if (!userId || (event.organizer_id !== userId && userRole !== 'ADMIN')) {
        throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
      }
    }

    const result = event.toPublicJSON();

    // Add organizer info
    if (event.organizer) {
      result.organizer = {
        id: event.organizer.id,
        fullName: event.organizer.full_name,
        avatarUrl: event.organizer.avatar_url,
      };
    }

    // Add isOwner flag
    result.isOwner = event.organizer_id === userId;

    // Add participantCount (use current_participants)
    result.participantCount = event.current_participants;

    // Add isJoined flag if user is logged in
    if (userId) {
      const hasJoined = await Inscription.findOne({
        where: {
          event_id: eventId,
          user_id: userId,
          status: {
            [Op.in]: ['CONFIRMED'],
          },
        },
      });
      result.isJoined = !!hasJoined;
    } else {
      result.isJoined = false;
    }

    return result;
  }

  /**
     * List events with filters
     * @param {Object} options - Query options
     * @param {string|null} userId - Optional requesting user ID
     */
  async listEvents(options = {}, userId = null) {
    // Default to showing only published events for public
    if (!options.includeUnpublished) {
      options.status = 'PUBLISHED';
    }

    const result = await EventRepository.findAll(options);

    // Fetch all inscriptions for the logged-in user (if any)
    let userInscriptions = [];
    if (userId) {
      userInscriptions = await InscriptionRepository.findByUserId(userId, { limit: 10000 }).then(r => r.inscriptions || []);
    }

    return {
      events: result.events.map((e) => {
        const obj = e.toPublicJSON();
        if (obj.imageUrl === null) delete obj.imageUrl;
        if (obj.tags == null) obj.tags = [];
        // Include organizer info
        if (e.organizer) {
          obj.organizer = {
            id: e.organizer.id,
            fullName: e.organizer.full_name,
            avatarUrl: e.organizer.avatar_url ?? undefined,
          };
        }
        // Add isJoined for each event (compare event_id AND event?.id)
        if (userId) {
          obj.isJoined = userInscriptions.some(
            (insc) =>
              ((insc.event && insc.event.id === e.id) || insc.event_id === e.id) &&
                ['CONFIRMED'].includes(insc.status),
          );
        } else {
          obj.isJoined = false;
        }
        return obj;
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
     * Update event
     * @param {string} eventId - Event ID
     * @param {Object} updates - Update data
     * @param {string} userId - Requesting user ID
     */
  async updateEvent(eventId, updates, userId, userRole = 'USER') {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Check ownership or admin rights
    if (event.organizer_id !== userId && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    // Prevent updating cancelled events
    if (event.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot update cancelled event', 'EVENT_CANCELLED');
    }

    // Map updates
    const mappedUpdates = {};
    if (updates.title) mappedUpdates.title = updates.title;
    if (updates.description !== undefined) mappedUpdates.description = updates.description;
    if (updates.location !== undefined) mappedUpdates.location = updates.location;
    if (updates.startDatetime) mappedUpdates.start_datetime = updates.startDatetime;
    if (updates.endDatetime) mappedUpdates.end_datetime = updates.endDatetime;
    if (updates.capacity) mappedUpdates.capacity = updates.capacity;
    if (updates.price !== undefined) mappedUpdates.price = updates.price;
    if (updates.currency) mappedUpdates.currency = updates.currency;
    if (updates.tags) mappedUpdates.tags = updates.tags;

    const updatedEvent = await EventRepository.update(eventId, mappedUpdates);
    logger.info(`Event updated: ${eventId}`);

    return updatedEvent.toPublicJSON();
  }

  /**
     * Delete event
     * @param {string} eventId - Event ID
     * @param {string} userId - Requesting user ID
     */
  async deleteEvent(eventId, userId, userRole = 'USER') {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    const user = userRole === 'ADMIN' ? { role: 'ADMIN' } : await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (event.organizer_id !== userId && user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    // Notify participants if event was published
    if (event.status === 'PUBLISHED') {
      const inscriptions = await InscriptionRepository.findByEventId(eventId);
      for (const inscription of inscriptions) {
        if (inscription.user && inscription.user.email) {
          await sendEventCancellationNotification(inscription.user.email, event);
        }
      }
    }

    await EventRepository.delete(eventId);
    logger.info(`Event deleted: ${eventId}`);

    return { message: 'Event deleted successfully' };
  }

  /**
     * Publish event
     * @param {string} eventId - Event ID
     * @param {string} userId - Requesting user ID
     */
  async publishEvent(eventId, userId, userRole = 'USER') {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    const user = userRole === 'ADMIN' ? { role: 'ADMIN' } : await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (event.organizer_id !== userId && user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    if (event.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot publish cancelled event', 'EVENT_CANCELLED');
    }

    if (event.status === 'PUBLISHED') {
      throw ApiError.badRequest('Event is already published', 'ALREADY_PUBLISHED');
    }

    // Validate event has required fields
    if (!event.title || !event.start_datetime) {
      throw ApiError.badRequest(
        'Event must have title and start date to publish',
        'INCOMPLETE_EVENT',
      );
    }

    const updatedEvent = await EventRepository.update(eventId, { status: 'PUBLISHED' });
    logger.info(`Event published: ${eventId}`);

    return updatedEvent.toPublicJSON();
  }

  /**
     * Unpublish event
     * @param {string} eventId - Event ID
     * @param {string} userId - Requesting user ID
     */
  async unpublishEvent(eventId, userId, userRole = 'USER') {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    const user = userRole === 'ADMIN' ? { role: 'ADMIN' } : await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (event.organizer_id !== userId && user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    if (event.status !== 'PUBLISHED') {
      throw ApiError.badRequest('Event is not published', 'NOT_PUBLISHED');
    }

    const updatedEvent = await EventRepository.update(eventId, { status: 'DRAFT' });
    logger.info(`Event unpublished: ${eventId}`);

    return updatedEvent.toPublicJSON();
  }

  /**
     * Cancel event
     * @param {string} eventId - Event ID
     * @param {string} userId - Requesting user ID
     */
  async cancelEvent(eventId, userId, userRole = 'USER') {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    if (event.organizer_id !== userId && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    if (event.status === 'CANCELLED') {
      throw ApiError.badRequest('Event is already cancelled', 'ALREADY_CANCELLED');
    }

    // Notify participants
    const inscriptions = await InscriptionRepository.findByEventId(eventId);
    for (const inscription of inscriptions) {
      if (inscription.user && inscription.user.email) {
        await sendEventCancellationNotification(inscription.user.email, event);
      }
      // Cancel all inscriptions
      await InscriptionRepository.update(inscription.id, { status: 'CANCELLED' });
    }

    const updatedEvent = await EventRepository.update(eventId, { status: 'CANCELLED' });
    logger.info(`Event cancelled: ${eventId}`);

    return updatedEvent.toPublicJSON();
  }

  /**
     * Get events by organizer
     * @param {string} organizerId - Organizer user ID
     * @param {Object} options - Query options
     */
  async getOrganizerEvents(organizerId, options = {}) {
    return EventRepository.findAll({
      ...options,
      organizerId,
      includeUnpublished: true,
    });
  }

  /**
     * Upload event image
     * @param {string} eventId - Event ID
     * @param {string} imageUrl - Image URL
     * @param {string} userId - Requesting user ID
     */
  async uploadImage(eventId, imageUrl, userId, userRole = 'USER') {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    if (event.organizer_id !== userId && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    await EventRepository.update(eventId, { image_url: imageUrl });
    logger.info(`Image uploaded for event: ${eventId}`);

    return { imageUrl };
  }
}

export default new EventService();

