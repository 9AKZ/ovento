/**
 * Role-based access control middleware
 * Must be used after authenticate middleware
 */

/**
 * Require specific roles
 * @param {...string} allowedRoles - Roles that are allowed access
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

/**
 * Require admin role
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Admin access required.',
      code: 'ADMIN_REQUIRED',
    });
  }

  next();
}

/**
 * Require organizer or admin role
 */
export function requireOrganizer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (!['ORGANIZER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Organizer access required.',
      code: 'ORGANIZER_REQUIRED',
    });
  }

  next();
}

/**
 * Require verified email
 */
export function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (!req.user.is_verified) {
    return res.status(403).json({
      error: 'Email verification required.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  next();
}

/**
 * Check if user owns the resource or is admin
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 */
export function requireOwnerOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    // Admin can access anything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied. You do not own this resource.',
          code: 'NOT_OWNER',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Error checking resource ownership.',
        code: 'OWNERSHIP_CHECK_ERROR',
      });
    }
  };
}

export default {
  requireRole,
  requireAdmin,
  requireOrganizer,
  requireVerified,
  requireOwnerOrAdmin,
};

