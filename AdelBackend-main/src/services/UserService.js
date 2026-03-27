import UserRepository from '../repositories/UserRepository.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import { ApiError } from '../middlewares/error.middleware.js';
import logger from '../config/logger.js';

class UserService {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Object} User profile
   */
  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user.toPublicJSON();
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Object} Updated user profile
   */
  async updateProfile(userId, updates) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Map camelCase to snake_case for allowed fields
    const allowedUpdates = {};
    if (updates.fullName) allowedUpdates.full_name = updates.fullName;
    if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;
    if (updates.avatarUrl !== undefined) allowedUpdates.avatar_url = updates.avatarUrl;

    const updatedUser = await UserRepository.update(userId, allowedUpdates);
    logger.info(`Profile updated for user: ${userId}`);
    
    return updatedUser.toPublicJSON();
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw ApiError.badRequest('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    await UserRepository.update(userId, { password_hash: passwordHash });
    logger.info(`Password changed for user: ${userId}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get user by ID (admin/organizer view)
   * @param {string} userId - User ID
   * @param {boolean} includePrivate - Include private info
   */
  async getUserById(userId, includePrivate = false) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (includePrivate) {
      return {
        ...user.toPublicJSON(),
        email: user.email,
      };
    }

    return user.toPublicJSON();
  }

  /**
   * List users (admin only)
   * @param {Object} options - Query options
   */
  async listUsers(options = {}) {
    return UserRepository.findAll(options);
  }

  /**
   * Update user (admin only)
   * @param {string} userId - User ID
   * @param {Object} updates - Updates
   */
  async adminUpdateUser(userId, updates) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const allowedUpdates = {};
    if (updates.fullName) allowedUpdates.full_name = updates.fullName;
    if (updates.email) {
      // Check if email is taken
      const existingUser = await UserRepository.findByEmail(updates.email);
      if (existingUser && existingUser.id !== userId) {
        throw ApiError.conflict('Email already in use', 'EMAIL_EXISTS');
      }
      allowedUpdates.email = updates.email;
    }
    if (updates.role) allowedUpdates.role = updates.role;
    if (updates.isVerified !== undefined) allowedUpdates.is_verified = updates.isVerified;
    if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;

    const updatedUser = await UserRepository.update(userId, allowedUpdates);
    logger.info(`Admin updated user: ${userId}`);

    return updatedUser.toPublicJSON();
  }

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID
   */
  async deleteUser(userId) {
    const deleted = await UserRepository.delete(userId);
    if (!deleted) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    logger.info(`User deleted: ${userId}`);
    return { message: 'User deleted successfully' };
  }

  /**
   * Upload avatar
   * @param {string} userId - User ID
   * @param {string} avatarUrl - Avatar URL
   */
  async uploadAvatar(userId, avatarUrl) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    await UserRepository.update(userId, { avatar_url: avatarUrl });
    logger.info(`Avatar updated for user: ${userId}`);

    return { avatarUrl };
  }
}

export default new UserService();

