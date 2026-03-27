import { Inscription, Event, User, Payment } from '../models/index.js';

class InscriptionRepository {
  /**
   * Find inscription by ID
   * @param {string} id - Inscription ID
   */
  async findById(id) {
    return Inscription.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'event',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'avatar_url'],
        },
        {
          model: Payment,
          as: 'payment',
        },
      ],
    });
  }

  /**
   * Create new inscription
   * @param {Object} inscriptionData - Inscription data
   */
  async create(inscriptionData) {
    return Inscription.create({
      event_id: inscriptionData.eventId,
      user_id: inscriptionData.userId,
      status: inscriptionData.status || 'PENDING',
      notes: inscriptionData.notes,
    });
  }

  /**
   * Update inscription
   * @param {string} id - Inscription ID
   * @param {Object} updates - Update data
   */
  async update(id, updates) {
    const inscription = await Inscription.findByPk(id);
    if (!inscription) return null;
    await inscription.update(updates);
    return inscription;
  }

  /**
   * Delete inscription
   * @param {string} id - Inscription ID
   */
  async delete(id) {
    const inscription = await Inscription.findByPk(id);
    if (!inscription) return false;
    await inscription.destroy();
    return true;
  }

  /**
   * Find inscription by event and user
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   */
  async findByEventAndUser(eventId, userId) {
    return Inscription.findOne({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      include: [
        {
          model: Event,
          as: 'event',
        },
        {
          model: Payment,
          as: 'payment',
        },
      ],
    });
  }

  /**
   * Find inscriptions by event ID
   * @param {string} eventId - Event ID
   * @param {Object} options - Query options
   */
  async findByEventId(eventId, options = {}) {
    const { status } = options;
    const where = { event_id: eventId };

    if (status) {
      where.status = status;
    }

    return Inscription.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'avatar_url'],
        },
        {
          model: Payment,
          as: 'payment',
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Find inscriptions by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const where = { user_id: userId };

    if (status) {
      where.status = status;
    }

    const { count, rows } = await Inscription.findAndCountAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'full_name', 'avatar_url'],
            },
          ],
        },
        {
          model: Payment,
          as: 'payment',
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      inscriptions: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Count inscriptions by event
   * @param {string} eventId - Event ID
   * @param {string} status - Optional status filter
   */
  async countByEvent(eventId, status = null) {
    const where = { event_id: eventId };
    if (status) {
      where.status = status;
    }
    return Inscription.count({ where });
  }

  /**
   * Get confirmed inscriptions count for event
   * @param {string} eventId - Event ID
   */
  async getConfirmedCount(eventId) {
    return this.countByEvent(eventId, 'CONFIRMED');
  }
}

export default new InscriptionRepository();

