import EventService from '../services/EventService.js';
import { getFileUrl } from '../middlewares/upload.middleware.js';

class EventController {
  /**
   * Create new event
   * POST /api/events
   */
  async createEvent(req, res, next) {
    try {
      // Parse tags if it's a JSON string (from FormData)
      let tags = req.body.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      }

      const eventData = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        startDatetime: req.body.startDatetime,
        endDatetime: req.body.endDatetime || undefined,
        capacity: parseInt(req.body.capacity, 10) || 100,
        price: parseFloat(req.body.price) || 0,
        currency: req.body.currency || 'EUR',
        tags: tags || [],
        status: req.body.status || 'DRAFT',
      };

      // Handle image upload if present
      if (req.file) {
        eventData.imageUrl = getFileUrl(req.file);
      }

      const event = await EventService.createEvent(eventData, req.userId);

      res.status(201).json({
        message: 'Event created',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event by ID
   * GET /api/events/:id
   */
  async getEvent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.userId || null;

      const event = await EventService.getEvent(id, userId, req.userRole);
      // Prevent caching of API response to ensure fresh data
      res.set('Cache-Control', 'no-store');
      res.json({ event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List events
   * GET /api/events
   */
  async listEvents(req, res, next) {
    try {
      const {
        page,
        limit,
        status,
        search,
        location,
        minPrice,
        maxPrice,
        startDate,
        endDate,
        organizerId,
        sortBy,
        sortOrder,
      } = req.query;

      // Allow organizers/admins to see their unpublished events
      const includeUnpublished =
        req.userRole === 'ADMIN' ||
        (req.userRole === 'ORGANIZER' && organizerId === req.userId);

      const result = await EventService.listEvents({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        status,
        search,
        location,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        startDate,
        endDate,
        organizerId,
        sortBy,
        sortOrder,
        includeUnpublished,
      }, req.userId || null);

      // Prevent caching of API response to ensure fresh data
      res.set('Cache-Control', 'no-store');
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event
   * PATCH /api/events/:id
   */
  async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const event = await EventService.updateEvent(id, updates, req.userId, req.userRole);

      res.json({
        message: 'Event updated',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete event
   * DELETE /api/events/:id
   */
  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;

      const result = await EventService.deleteEvent(id, req.userId, req.userRole);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish event
   * POST /api/events/:id/publish
   */
  async publishEvent(req, res, next) {
    try {
      const { id } = req.params;

      const event = await EventService.publishEvent(id, req.userId, req.userRole);

      res.json({
        message: 'Event published',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unpublish event
   * POST /api/events/:id/unpublish
   */
  async unpublishEvent(req, res, next) {
    try {
      const { id } = req.params;

      const event = await EventService.unpublishEvent(id, req.userId, req.userRole);

      res.json({
        message: 'Event unpublished',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel event
   * POST /api/events/:id/cancel
   */
  async cancelEvent(req, res, next) {
    try {
      const { id } = req.params;

      const event = await EventService.cancelEvent(id, req.userId, req.userRole);

      res.json({
        message: 'Event cancelled',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer's events
   * GET /api/events/my-events
   */
  async getMyEvents(req, res, next) {
    try {
      const { page, limit, status, sortBy, sortOrder } = req.query;

      let result;
      if (req.userRole === 'ADMIN') {
        result = await EventService.listEvents({
          page: parseInt(page, 10) || 1,
          limit: parseInt(limit, 10) || 20,
          status,
          sortBy,
          sortOrder,
          includeUnpublished: true,
        });
      } else {
        result = await EventService.getOrganizerEvents(req.userId, {
          page: parseInt(page, 10) || 1,
          limit: parseInt(limit, 10) || 20,
          status,
          sortBy,
          sortOrder,
        });
      }

      // Prevent caching of API response to ensure fresh data
      res.set('Cache-Control', 'no-store');
      res.json({
        events: result.events.map((e) => {
          if (typeof e.toPublicJSON === 'function') {
            return e.toPublicJSON();
          }
          return e;
        }),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload event image
   * POST /api/events/:id/image
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          code: 'NO_FILE',
        });
      }

      const { id } = req.params;
      const imageUrl = getFileUrl(req.file);

      const result = await EventService.uploadImage(id, imageUrl, req.userId, req.userRole);

      res.json({
        message: 'Image uploaded',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EventController();

