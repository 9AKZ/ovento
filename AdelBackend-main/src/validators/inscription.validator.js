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
 * Inscription ID validation schema
 */
export const inscriptionIdSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Create inscription validation schema
 */
export const createInscriptionSchema = {
  params: Joi.object({
    id: uuidSchema.required(), // event ID
  }),
  body: Joi.object({
    notes: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'Notes must be at most 500 characters',
      }),
  }),
};

/**
 * List inscriptions validation schema
 */
export const listInscriptionsSchema = {
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
      .valid('PENDING', 'CONFIRMED', 'CANCELLED'),
    sortBy: Joi.string()
      .valid('created_at', 'status')
      .default('created_at'),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc'),
  }),
};

export default {
  inscriptionIdSchema,
  createInscriptionSchema,
  listInscriptionsSchema,
};
