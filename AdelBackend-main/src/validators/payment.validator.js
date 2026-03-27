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
 * Payment ID validation schema
 */
export const paymentIdSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Initialize payment validation schema
 */
export const initializePaymentSchema = {
  params: Joi.object({
    id: uuidSchema.required(), // event ID
  }),
};

/**
 * Mock payment validation schema
 */
export const mockPaymentSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    simulateFailure: Joi.boolean()
      .default(false),
  }),
};

/**
 * List payments validation schema
 */
export const listPaymentsSchema = {
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
      .valid('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
    sortBy: Joi.string()
      .valid('created_at', 'amount', 'status')
      .default('created_at'),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc'),
  }),
};

export default {
  paymentIdSchema,
  initializePaymentSchema,
  mockPaymentSchema,
  listPaymentsSchema,
};
