import Joi from 'joi';

// Password validation pattern
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

/**
 * Register validation schema
 */
export const registerSchema = {
  body: Joi.object({
    fullName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must be at most 100 characters',
        'any.required': 'Full name is required',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(passwordPattern)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password must be at most 128 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
        'any.required': 'Password is required',
      }),
    role: Joi.string()
      .valid('USER', 'ORGANIZER')
      .default('USER')
      .messages({
        'any.only': 'Role must be USER or ORGANIZER',
      }),
  }),
};

/**
 * Login validation schema
 */
export const loginSchema = {
  body: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),
};

/**
 * Refresh token validation schema
 */
export const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string()
      .optional()
      .messages({
        'string.base': 'Refresh token must be a string',
      }),
  }),
};

/**
 * Logout validation schema
 */
export const logoutSchema = {
  body: Joi.object({
    // Refresh token may be provided in the body or as an httpOnly cookie; make it optional
    refreshToken: Joi.string()
      .optional()
      .messages({
        'string.base': 'Refresh token must be a string',
      }),
  }),
};

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
  }),
};

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required',
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(passwordPattern)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password must be at most 128 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
        'any.required': 'Password is required',
      }),
  }),
};

/**
 * Verify email validation schema
 */
export const verifyEmailSchema = {
  query: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Verification token is required',
      }),
  }),
};

export default {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
};

