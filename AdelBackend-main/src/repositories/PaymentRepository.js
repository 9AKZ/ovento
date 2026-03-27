import { Payment, Event, User, Inscription } from '../models/index.js';

class PaymentRepository {
  /**
   * Find payment by ID
   * @param {string} id - Payment ID
   */
  async findById(id) {
    return Payment.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'event',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email'],
        },
        {
          model: Inscription,
          as: 'inscription',
        },
      ],
    });
  }

  /**
   * Create new payment
   * @param {Object} paymentData - Payment data
   */
  async create(paymentData) {
    return Payment.create({
      user_id: paymentData.userId,
      event_id: paymentData.eventId,
      inscription_id: paymentData.inscriptionId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'EUR',
      provider: paymentData.provider || 'stripe',
      provider_payment_id: paymentData.providerPaymentId,
      status: paymentData.status || 'PENDING',
      metadata: paymentData.metadata,
    });
  }

  /**
   * Update payment
   * @param {string} id - Payment ID
   * @param {Object} updates - Update data
   */
  async update(id, updates) {
    const payment = await Payment.findByPk(id);
    if (!payment) return null;
    await payment.update(updates);
    return payment;
  }

  /**
   * Find payment by provider payment ID
   * @param {string} providerPaymentId - Provider's payment ID
   */
  async findByProviderPaymentId(providerPaymentId) {
    return Payment.findOne({
      where: { provider_payment_id: providerPaymentId },
    });
  }

  /**
   * Find payment by inscription
   * @param {string} inscriptionId - Inscription ID
   */
  async findByInscription(inscriptionId) {
    return Payment.findOne({
      where: { inscription_id: inscriptionId },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Find payments by user ID
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

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'start_datetime', 'image_url'],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      payments: rows.map((p) => p.toPublicJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Find payments by event ID
   * @param {string} eventId - Event ID
   * @param {Object} options - Query options
   */
  async findByEventId(eventId, options = {}) {
    const { status } = options;
    const where = { event_id: eventId };

    if (status) {
      where.status = status;
    }

    return Payment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get total revenue for event
   * @param {string} eventId - Event ID
   */
  async getEventRevenue(eventId) {
    const result = await Payment.sum('amount', {
      where: {
        event_id: eventId,
        status: 'PAID',
      },
    });
    return result || 0;
  }

  /**
   * Get payment statistics
   * @param {string} userId - Optional user ID for filtering
   */
  async getStatistics(userId = null) {
    const where = { status: 'PAID' };
    if (userId) {
      where.user_id = userId;
    }

    const totalRevenue = await Payment.sum('amount', { where });
    const totalPayments = await Payment.count({ where });

    return {
      totalRevenue: totalRevenue || 0,
      totalPayments,
    };
  }
}

export default new PaymentRepository();

