import { User, RefreshToken } from '../models/index.js';
import { Op } from 'sequelize';

class UserRepository {
  /**
   * Find user by ID
   * @param {string} id - User ID
   */
  async findById(id) {
    return User.findByPk(id);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   */
  async findByEmail(email) {
    return User.findOne({ where: { email: email.toLowerCase() } });
  }

  /**
   * Find user by verification token
   * @param {string} token - Verification token
   */
  async findByVerificationToken(token) {
    return User.findOne({ where: { verification_token: token } });
  }

  /**
   * Find user by reset password token
   * @param {string} token - Reset password token
   */
  async findByResetToken(token) {
    return User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() },
      },
    });
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   */
  async create(userData) {
    return User.create({
      email: userData.email.toLowerCase(),
      password_hash: userData.passwordHash,
      full_name: userData.fullName,
      role: userData.role || 'USER',
      verification_token: userData.verificationToken,
      is_verified: userData.isVerified || false,
    });
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Update data
   */
  async update(id, updates) {
    const user = await User.findByPk(id);
    if (!user) return null;

    const allowedUpdates = [
      'full_name',
      'bio',
      'avatar_url',
      'email',
      'password_hash',
      'role',
      'is_verified',
      'verification_token',
      'reset_password_token',
      'reset_password_expires',
    ];

    const filteredUpdates = {};
    for (const key of Object.keys(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (allowedUpdates.includes(snakeKey)) {
        filteredUpdates[snakeKey] = updates[key];
      } else if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    await user.update(filteredUpdates);
    return user;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   */
  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  /**
   * List users with pagination and filters
   * @param {Object} options - Query options
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token'] },
    });

    return {
      users: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   */
  async emailExists(email) {
    const count = await User.count({ where: { email: email.toLowerCase() } });
    return count > 0;
  }

  /**
   * Store refresh token
   * @param {Object} tokenData - Token data
   */
  async storeRefreshToken(tokenData) {
    return RefreshToken.create({
      user_id: tokenData.userId,
      token_hash: tokenData.tokenHash,
      expires_at: tokenData.expiresAt,
      user_agent: tokenData.userAgent,
      ip_address: tokenData.ipAddress,
    });
  }

  /**
   * Find refresh token by hash
   * @param {string} tokenHash - Token hash
   */
  async findRefreshToken(tokenHash) {
    return RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
        revoked: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });
  }

  /**
   * Revoke refresh token
   * @param {string} tokenHash - Token hash
   */
  async revokeRefreshToken(tokenHash) {
    const token = await RefreshToken.findOne({ where: { token_hash: tokenHash } });
    if (token) {
      await token.update({ revoked: true });
    }
    return token;
  }

  /**
   * Revoke all user refresh tokens
   * @param {string} userId - User ID
   */
  async revokeAllUserTokens(userId) {
    return RefreshToken.update(
      { revoked: true },
      { where: { user_id: userId } },
    );
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    return RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expires_at: { [Op.lt]: new Date() } },
          { revoked: true },
        ],
      },
    });
  }
}

export default new UserRepository();

