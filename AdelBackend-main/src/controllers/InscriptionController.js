import InscriptionService from '../services/InscriptionService.js';

class InscriptionController {
  /**
   * Register for an event
   * POST /api/events/:id/inscriptions
   */
  async registerForEvent(req, res, next) {
    try {
      const { id: eventId } = req.params;

      const inscription = await InscriptionService.registerForEvent(
        eventId,
        req.userId,
      );

      res.status(201).json({
        message: 'Registration successful',
        inscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel inscription
   * PATCH /api/inscriptions/:id/cancel
   */
  async cancelInscription(req, res, next) {
    try {
      const { id } = req.params;

      const result = await InscriptionService.cancelInscription(id, req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's inscriptions
   * GET /api/users/me/inscriptions
   */
  async getUserInscriptions(req, res, next) {
    try {
      const { page, limit, status, sortBy, sortOrder } = req.query;

      const result = await InscriptionService.getUserInscriptions(req.userId, {
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
   * Get event inscriptions (organizer/admin)
   * GET /api/events/:id/inscriptions
   */
  async getEventInscriptions(req, res, next) {
    try {
      const { id: eventId } = req.params;
      const { status } = req.query;

      const result = await InscriptionService.getEventInscriptions(
        eventId,
        req.userId,
        { status },
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inscription by ID
   * GET /api/inscriptions/:id
   */
  async getInscription(req, res, next) {
    try {
      const { id } = req.params;

      const inscription = await InscriptionService.getInscription(id);
      res.json({ inscription });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Leave event (cancel inscription by event ID)
   * DELETE /api/events/:id/inscriptions
   */
  async leaveEvent(req, res, next) {
    try {
      const { id: eventId } = req.params;

      const result = await InscriptionService.leaveEvent(eventId, req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new InscriptionController();

