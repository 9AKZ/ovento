import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
const ACCESS_EXP = process.env.JWT_ACCESS_EXP || '15m';
const REFRESH_EXP = process.env.JWT_REFRESH_EXP || '30d';

/**
 * Generate access token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} JWT access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXP,
    issuer: 'onelastevent',
    audience: 'onelastevent-users',
  });
}

/**
 * Generate refresh token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXP,
    issuer: 'onelastevent',
    audience: 'onelastevent-users',
  });
}

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, {
    issuer: 'onelastevent',
    audience: 'onelastevent-users',
  });
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, {
    issuer: 'onelastevent',
    audience: 'onelastevent-users',
  });
}

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
export function generateTokenPair(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ userId: user.id }),
  };
}

/**
 * Hash a token for storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random token (for email verification, password reset)
 * @returns {string} Random token
 */
export function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get token expiration time in seconds
 * @param {string} expString - Expiration string (e.g., '15m', '30d')
 * @returns {number} Expiration in seconds
 */
export function getExpirationInSeconds(expString) {
  const match = expString.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
  case 's': return value;
  case 'm': return value * 60;
  case 'h': return value * 60 * 60;
  case 'd': return value * 24 * 60 * 60;
  default: return 900;
  }
}

/**
 * Get refresh token expiration date
 * @returns {Date} Expiration date
 */
export function getRefreshTokenExpiration() {
  const seconds = getExpirationInSeconds(REFRESH_EXP);
  return new Date(Date.now() + seconds * 1000);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  hashToken,
  generateRandomToken,
  getExpirationInSeconds,
  getRefreshTokenExpiration,
};

