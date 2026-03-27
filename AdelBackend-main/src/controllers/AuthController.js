import AuthService from '../services/AuthService.js';
import { getExpirationInSeconds } from '../utils/jwt.util.js';

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { fullName, email, password, role } = req.body;

      const result = await AuthService.register({
        fullName,
        email,
        password,
        role,
      });

      // Set access & refresh tokens as httpOnly cookies
      const accessMaxAge = getExpirationInSeconds(process.env.JWT_ACCESS_EXP || '15m') * 1000;
      const refreshMaxAge = getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d') * 1000;

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: accessMaxAge,
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshMaxAge,
      });

      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(
        { email, password },
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        },
      );

      // Set tokens as httpOnly cookies
      const accessMaxAge = getExpirationInSeconds(process.env.JWT_ACCESS_EXP || '15m') * 1000;
      const refreshMaxAge = getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d') * 1000;

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: accessMaxAge,
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshMaxAge,
      });

      res.json({
        message: 'Login successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      // Support refresh token from body or httpOnly cookie
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken || (() => {
        const header = req.headers.cookie;
        if (!header) return undefined;
        const match = header.match(/(?:^|; )refreshToken=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : undefined;
      })();

      const tokens = await AuthService.refresh(refreshToken);

      // Set new tokens as httpOnly cookies
      const accessMaxAge = getExpirationInSeconds(process.env.JWT_ACCESS_EXP || '15m') * 1000;
      const refreshMaxAge = getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d') * 1000;

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: accessMaxAge,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshMaxAge,
      });

      res.json({
        message: 'Token refreshed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      // Support refresh token from body or cookies
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken || (() => {
        const header = req.headers.cookie;
        if (!header) return undefined;
        const match = header.match(/(?:^|; )refreshToken=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : undefined;
      })();
      const accessToken = req.token;

      await AuthService.logout(refreshToken, accessToken);

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  async logoutAll(req, res, next) {
    try {
      await AuthService.logoutAll(req.userId);
      res.json({ message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * GET /api/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;

      const result = await AuthService.verifyEmail(token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await AuthService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const result = await AuthService.resetPassword(token, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      if (!req.user) {
        return res.json({ user: null });
      }
      res.json({
        user: req.user.toPublicJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

