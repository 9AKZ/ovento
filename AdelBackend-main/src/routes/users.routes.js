import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import InscriptionController from '../controllers/InscriptionController.js';
import PaymentController from '../controllers/PaymentController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { uploadSingle } from '../middlewares/upload.middleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  getUserByIdSchema,
  adminUpdateUserSchema,
  listUsersSchema,
} from '../validators/user.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', UserController.getProfile);

/**
 * @route PATCH /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.patch(
  '/me',
  validate(updateProfileSchema),
  UserController.updateProfile,
);

/**
 * @route POST /api/users/me/change-password
 * @desc Change password
 * @access Private
 */
router.post(
  '/me/change-password',
  validate(changePasswordSchema),
  UserController.changePassword,
);

/**
 * @route POST /api/users/me/avatar
 * @desc Upload avatar
 * @access Private
 */
router.post(
  '/me/avatar',
  uploadSingle('avatar'),
  UserController.uploadAvatar,
);

/**
 * @route GET /api/users/me/inscriptions
 * @desc Get user's event inscriptions
 * @access Private
 */
router.get('/me/inscriptions', InscriptionController.getUserInscriptions);

/**
 * @route GET /api/users/me/payments
 * @desc Get user's payments
 * @access Private
 */
router.get('/me/payments', PaymentController.getUserPayments);

/**
 * @route GET /api/users
 * @desc List users (admin only)
 * @access Private/Admin
 */
router.get(
  '/',
  requireAdmin,
  validate(listUsersSchema),
  UserController.listUsers,
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get(
  '/:id',
  validate(getUserByIdSchema),
  UserController.getUserById,
);

/**
 * @route PATCH /api/users/:id
 * @desc Update user (admin only)
 * @access Private/Admin
 */
router.patch(
  '/:id',
  requireAdmin,
  validate(adminUpdateUserSchema),
  UserController.adminUpdateUser,
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (admin only)
 * @access Private/Admin
 */
router.delete(
  '/:id',
  requireAdmin,
  validate(getUserByIdSchema),
  UserController.deleteUser,
);

export default router;

