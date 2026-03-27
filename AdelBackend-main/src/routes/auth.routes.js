import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  AuthController.register,
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.login,
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post(
  '/refresh',
  validate(refreshSchema),
  AuthController.refresh,
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post(
  '/logout',
  validate(logoutSchema),
  AuthController.logout,
);

/**
 * @route POST /api/auth/logout-all
 * @desc Logout from all devices
 * @access Private
 */
router.post(
  '/logout-all',
  authenticate,
  AuthController.logoutAll,
);

/**
 * @route GET /api/auth/verify-email
 * @desc Verify email address
 * @access Public
 */
router.get(
  '/verify-email',
  validate(verifyEmailSchema),
  AuthController.verifyEmail,
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password
 * @access Public
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Public (optional)
 */
router.get(
  '/me',
  optionalAuth,
  AuthController.getCurrentUser,
);

export default router;

