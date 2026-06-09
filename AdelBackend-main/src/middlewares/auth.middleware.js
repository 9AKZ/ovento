import { verifyAccessToken } from '../utils/jwt.util.js';
import { isTokenBlacklisted } from '../config/redis.js';
import { User } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|; )accessToken=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        error: 'Token has been revoked.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Attach user and token info to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.token = token;
    req.lastLoginAt = decoded.lastLoginAt ?? null;

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      error: 'Authentication failed.',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, continues without user otherwise
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return next();

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.userId);

    if (user) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
      req.token = token;
    }

    next();
  } catch {
    // Continue without user on any error
    next();
  }
}

export default { authenticate, optionalAuth };

