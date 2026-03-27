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
 * Update user profile validation schema
 */
export const updateProfileSchema = {
  body: Joi.object({
    fullName: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must be at most 100 characters',
      }),
    bio: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'Bio must be at most 500 characters',
      }),
    avatarUrl: Joi.string()
      .uri()
      .allow('')
      .messages({
        'string.uri': 'Avatar URL must be a valid URL',
      }),
  }).min(1).messages({
    'object.min': 'At least one field is required for update',
  }),
};

/**
 * Change password validation schema
 */
export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required',
      }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters',
        'string.max': 'New password must be at most 128 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
        'any.required': 'New password is required',
      }),
  }),
};

/**
 * Get user by ID validation schema
 */
export const getUserByIdSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
};

/**
 * Admin update user validation schema
 */
export const adminUpdateUserSchema = {
  params: Joi.object({
    id: uuidSchema.required(),
  }),
  body: Joi.object({
    fullName: Joi.string()
      .min(2)
      .max(100),
    email: Joi.string()
      .email(),
    role: Joi.string()
      .valid('USER', 'ORGANIZER', 'ADMIN'),
    isVerified: Joi.boolean(),
    bio: Joi.string()
      .max(500)
      .allow(''),
  }).min(1),
};

/**
 * List users validation schema (admin)
 */
export const listUsersSchema = {
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
    role: Joi.string()
      .valid('USER', 'ORGANIZER', 'ADMIN'),
    search: Joi.string()
      .max(100),
    sortBy: Joi.string()
      .valid('created_at', 'full_name', 'email')
      .default('created_at'),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc'),
  }),
};

export default {
  updateProfileSchema,
  changePasswordSchema,
  getUserByIdSchema,
  adminUpdateUserSchema,
  listUsersSchema,
};

