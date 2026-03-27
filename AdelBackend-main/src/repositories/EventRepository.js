import { Event, User } from '../models/index.js';
import { Op } from 'sequelize';

class EventRepository {
  /**
   * Find event by ID
   * @param {string} id - Event ID
   */
  async findById(id) {
    return Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'email', 'avatar_url'],
        },
      ],
    });
  }

  /**
   * Create new event
   * @param {Object} eventData - Event data
   */
  async create(eventData) {
    return Event.create({
      organizer_id: eventData.organizerId,
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start_datetime: eventData.startDatetime,
      end_datetime: eventData.endDatetime,
      capacity: eventData.capacity || 100,
      price: eventData.price || 0,
      currency: eventData.currency || 'EUR',
      status: eventData.status || 'DRAFT',
      tags: eventData.tags || [],
      image_url: eventData.imageUrl,
    });
  }

  /**
   * Update event
   * @param {string} id - Event ID
   * @param {Object} updates - Update data
   */
  async update(id, updates) {
    const event = await Event.findByPk(id);
    if (!event) return null;
    await event.update(updates);
    return event;
  }

  /**
   * Delete event
   * @param {string} id - Event ID
   */
  async delete(id) {
    const event = await Event.findByPk(id);
    if (!event) return false;
    await event.destroy();
    return true;
  }

  /**
   * Find all events with filters
   * @param {Object} options - Query options
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      location,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      organizerId,
      sortBy = 'start_datetime',
      sortOrder = 'asc',
      includeUnpublished = false,
    } = options;

    const where = {};

    // Status filter
    if (status) {
      where.status = status;
    } else if (!includeUnpublished) {
      where.status = 'PUBLISHED';
    }

    // Organizer filter
    if (organizerId) {
      where.organizer_id = organizerId;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    // Location filter
    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }

    // Price filters
    if (minPrice !== undefined) {
      where.price = { ...where.price, [Op.gte]: minPrice };
    }
    if (maxPrice !== undefined) {
      where.price = { ...where.price, [Op.lte]: maxPrice };
    }

    // Date filters
    if (startDate) {
      where.start_datetime = { ...where.start_datetime, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.start_datetime = { ...where.start_datetime, [Op.lte]: new Date(endDate) };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'avatar_url'],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      events: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Increment participant count
   * @param {string} eventId - Event ID
   */
  async incrementParticipants(eventId) {
    const event = await Event.findByPk(eventId);
    if (event) {
      await event.increment('current_participants');
    }
  }

  /**
   * Decrement participant count
   * @param {string} eventId - Event ID
   */
  async decrementParticipants(eventId) {
    const event = await Event.findByPk(eventId);
    if (event && event.current_participants > 0) {
      await event.decrement('current_participants');
    }
  }

  /**
   * Get upcoming events
   * @param {number} limit - Number of events
   */
  async getUpcoming(limit = 10) {
    return Event.findAll({
      where: {
        status: 'PUBLISHED',
        start_datetime: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'avatar_url'],
        },
      ],
      order: [['start_datetime', 'ASC']],
      limit,
    });
  }

  /**
   * Get popular events (most participants)
   * @param {number} limit - Number of events
   */
  async getPopular(limit = 10) {
    return Event.findAll({
      where: {
        status: 'PUBLISHED',
        start_datetime: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'avatar_url'],
        },
      ],
      order: [['current_participants', 'DESC']],
      limit,
    });
  }
}

export default new EventRepository();

