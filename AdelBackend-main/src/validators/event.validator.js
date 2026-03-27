import Joi from 'joi';

/**
 * UUID validation helper
 */
const uuidSchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .messages({
    'string.guid': 'Invalid ID format',
  });

/**
 * Create event validation schema
 */
export const createEventSchema = {
  body: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title must be at most 255 characters',
        'any.required': 'Title is required',
      }),
    description: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description must be at most 5000 characters',
      }),
    location: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Location must be at most 500 characters',
      }),
    startDatetime: Joi.date()
      .required()
      .messages({
        'any.required': 'Start date is required',
      }),
    endDatetime: Joi.date()
      .allow(null, ''),
    capacity: Joi.alternatives()
      .try(Joi.number().integer().min(1).max(100000), Joi.string())
      .default(100),
    price: Joi.alternatives()
      .try(Joi.number().min(0).max(999999.99), Joi.string())
      .default(0),
    currency: Joi.string()
      .max(3)
      .default('EUR'),
    tags: Joi.alternatives()
      .try(
        Joi.array().items(Joi.string().max(50)).max(10),
        Joi.string().allow(''),
      )
      .default([]),
    status: Joi.string()
      .valid('DRAFT', 'PUBLISHED')
      .default('DRAFT'),
  }),
};

/**
 * Update event validation schema
 */
export const updateEventSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255),
    description: Joi.string()
      .max(5000)
      .allow(''),
    location: Joi.string()
      .max(500)
      .allow(''),
    startDatetime: Joi.date()
      .iso(),
    endDatetime: Joi.date()
      .iso(),
    capacity: Joi.number()
      .integer()
      .min(1)
      .max(100000),
    price: Joi.number()
      .min(0)
      .max(999999.99)
      .precision(2),
    currency: Joi.string()
      .length(3)
      .uppercase(),
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(10),
  }).min(1).messages({
    'object.min': 'At least one field is required for update',
  }),
};

/**
 * Get event by ID validation schema
 */
export const getEventSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * List events validation schema
 */
export const listEventsSchema = {
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),
    status: Joi.string()
      .valid('DRAFT', 'PUBLISHED', 'CANCELLED'),
    search: Joi.string()
      .max(100),
    location: Joi.string()
      .max(100),
    minPrice: Joi.number()
      .min(0),
    maxPrice: Joi.number()
      .min(0),
    startDate: Joi.date()
      .iso(),
    endDate: Joi.date()
      .iso(),
    organizerId: uuidSchema,
    sortBy: Joi.string()
      .valid('start_datetime', 'created_at', 'price', 'title')
      .default('start_datetime'),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('asc'),
  }),
};

/**
 * Publish/unpublish event validation schema
 */
export const publishEventSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Delete event validation schema
 */
export const deleteEventSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

export default {
  createEventSchema,
  updateEventSchema,
  getEventSchema,
  listEventsSchema,
  publishEventSchema,
  deleteEventSchema,
};

