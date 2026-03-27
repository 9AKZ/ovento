import UserService from '../services/UserService.js';
import { getFileUrl } from '../middlewares/upload.middleware.js';

class UserController {
  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getProfile(req, res, next) {
    try {
      const profile = await UserService.getProfile(req.userId);
      res.json({ user: profile });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * PATCH /api/users/me
   */
  async updateProfile(req, res, next) {
    try {
      const { fullName, bio, avatarUrl } = req.body;

      const updatedUser = await UserService.updateProfile(req.userId, {
        fullName,
        bio,
        avatarUrl,
      });

      res.json({
        message: 'Profile updated',
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/users/me/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const result = await UserService.changePassword(
        req.userId,
        currentPassword,
        newPassword,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload avatar
   * POST /api/users/me/avatar
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          code: 'NO_FILE',
        });
      }

      const avatarUrl = getFileUrl(req.file);
      const result = await UserService.uploadAvatar(req.userId, avatarUrl);

      res.json({
        message: 'Avatar uploaded',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin/public view)
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const includePrivate = req.userRole === 'ADMIN';

      const user = await UserService.getUserById(id, includePrivate);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List users (admin only)
   * GET /api/users
   */
  async listUsers(req, res, next) {
    try {
      const { page, limit, role, search, sortBy, sortOrder } = req.query;

      const result = await UserService.listUsers({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        role,
        search,
        sortBy,
        sortOrder,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user (admin only)
   * PATCH /api/users/:id
   */
  async adminUpdateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedUser = await UserService.adminUpdateUser(id, updates);

      res.json({
        message: 'User updated',
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await UserService.deleteUser(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();

