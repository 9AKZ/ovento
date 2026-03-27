import UserRepository from '../repositories/UserRepository.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
  getRefreshTokenExpiration,
  getExpirationInSeconds,
} from '../utils/jwt.util.js';
import {
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isRefreshTokenValid,
  blacklistToken,
} from '../config/redis.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.util.js';
import { ApiError } from '../middlewares/error.middleware.js';
import logger from '../config/logger.js';

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User and tokens
   */
  async register(userData) {
    const { fullName, email, password } = userData;

    // Check if email already exists
    const emailNormalized = email.trim().toLowerCase();
    const existingUser = await UserRepository.findByEmail(emailNormalized);
    if (existingUser) {
      throw ApiError.conflict('Email already registered', 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateRandomToken();

    // Create user (normalize email in DB)
    const user = await UserRepository.create({
      fullName,
      email: emailNormalized,
      passwordHash,
      role: 'USER',
      verificationToken,
      isVerified: false,
    });

    // Send verification email (stubbed)
    await sendVerificationEmail(emailNormalized, verificationToken);

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token
    const tokenHash = hashToken(tokens.refreshToken);
    await storeRefreshToken(
      user.id,
      tokenHash,
      getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d'),
    );

    // Store in DB as well for rotation tracking
    await UserRepository.storeRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: getRefreshTokenExpiration(),
    });

    logger.info(`User registered: ${emailNormalized}`);

    return {
      user: user.toPublicJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {Object} requestInfo - Request metadata
   * @returns {Object} User and tokens
   */
  async login(credentials, requestInfo = {}) {
    const emailNormalized = credentials.email.trim().toLowerCase();
    const { password } = credentials;

    // Find user
    const user = await UserRepository.findByEmail(emailNormalized);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token
    const tokenHash = hashToken(tokens.refreshToken);
    await storeRefreshToken(
      user.id,
      tokenHash,
      getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d'),
    );

    // Store in DB
    await UserRepository.storeRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: getRefreshTokenExpiration(),
      userAgent: requestInfo.userAgent,
      ipAddress: requestInfo.ipAddress,
    });

    logger.info(`User logged in: ${emailNormalized}`);

    return {
      user: user.toPublicJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  async refresh(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);

      // Check if token is valid in Redis
      const isValid = await isRefreshTokenValid(decoded.userId, tokenHash);
      if (!isValid) {
        // Also check DB
        const dbToken = await UserRepository.findRefreshToken(tokenHash);
        if (!dbToken || dbToken.revoked) {
          throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
        }
      }

      // Get user
      const user = await UserRepository.findById(decoded.userId);
      if (!user) {
        throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
      }

      // Revoke old token (rotation)
      await revokeRefreshToken(decoded.userId, tokenHash);
      await UserRepository.revokeRefreshToken(tokenHash);

      // Generate new tokens
      const tokens = generateTokenPair(user);
      const newTokenHash = hashToken(tokens.refreshToken);

      // Store new refresh token
      await storeRefreshToken(
        user.id,
        newTokenHash,
        getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d'),
      );

      await UserRepository.storeRefreshToken({
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt: getRefreshTokenExpiration(),
      });

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error.isOperational) throw error;
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Logout user
   * @param {string} refreshToken - Refresh token to revoke
   * @param {string} accessToken - Access token to blacklist
   */
  async logout(refreshToken, accessToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);

      // Revoke refresh token
      await revokeRefreshToken(decoded.userId, tokenHash);
      await UserRepository.revokeRefreshToken(tokenHash);

      // Blacklist access token
      if (accessToken) {
        await blacklistToken(
          accessToken,
          getExpirationInSeconds(process.env.JWT_ACCESS_EXP || '15m'),
        );
      }

      logger.info(`User logged out: ${decoded.userId}`);
      return true;
    } catch (error) {
      // Even if token is invalid, consider logout successful
      logger.warn('Logout with invalid token');
      return true;
    }
  }

  /**
   * Logout from all devices
   * @param {string} userId - User ID
   */
  async logoutAll(userId) {
    await revokeAllUserTokens(userId);
    await UserRepository.revokeAllUserTokens(userId);
    logger.info(`User logged out from all devices: ${userId}`);
    return true;
  }

  /**
   * Verify email
   * @param {string} token - Verification token
   */
  async verifyEmail(token) {
    const user = await UserRepository.findByVerificationToken(token);
    if (!user) {
      throw ApiError.badRequest('Invalid verification token', 'INVALID_TOKEN');
    }

    await UserRepository.update(user.id, {
      is_verified: true,
      verification_token: null,
    });

    logger.info(`Email verified for user: ${user.email}`);
    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   * @param {string} email - User email
   */
  async forgotPassword(email) {
    const user = await UserRepository.findByEmail(email);
    
    // Don't reveal if email exists
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserRepository.update(user.id, {
      reset_password_token: resetToken,
      reset_password_expires: resetExpires,
    });

    // Send reset email (stubbed)
    await sendPasswordResetEmail(email, resetToken);

    logger.info(`Password reset requested for: ${email}`);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   */
  async resetPassword(token, newPassword) {
    const user = await UserRepository.findByResetToken(token);
    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await UserRepository.update(user.id, {
      password_hash: passwordHash,
      reset_password_token: null,
      reset_password_expires: null,
    });

    // Revoke all refresh tokens for security
    await revokeAllUserTokens(user.id);
    await UserRepository.revokeAllUserTokens(user.id);

    logger.info(`Password reset for user: ${user.email}`);
    return { message: 'Password reset successfully' };
  }
}

export default new AuthService();

