import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';

class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return sendError(res, 400, 'Missing required fields', 'Email, password, firstName, and lastName are required');
      }

      // Register user
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendSuccess(res, 201, 'User registered successfully', {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      console.error('Register error:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      return sendError(res, 400, message);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return sendError(res, 400, 'Missing required fields', 'Email and password are required');
      }

      // Login user
      const result = await authService.login({ email, password });

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendSuccess(res, 200, 'Login successful', {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      return sendError(res, 401, message);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      // Get user ID from request (will be set by auth middleware)
      const userId = (req as any).user?.userId;

      if (!userId) {
        return sendError(res, 401, 'Not authenticated');
      }

      // Logout user (clear refresh token in database)
      await authService.logout(userId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      return sendSuccess(res, 200, 'Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      return sendError(res, 500, 'Logout failed');
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async getProfile(req: Request, res: Response) {
    try {
      // Get user ID from request (will be set by auth middleware)
      const userId = (req as any).user?.userId;

      if (!userId) {
        return sendError(res, 401, 'Not authenticated');
      }

      // Get user profile
      const user = await authService.getUserById(userId);

      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      return sendSuccess(res, 200, 'Profile retrieved successfully', { user });
    } catch (error) {
      console.error('Get profile error:', error);
      return sendError(res, 500, 'Failed to retrieve profile');
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response) {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return sendError(res, 401, 'Refresh token not found');
      }

      // Refresh access token
      const result = await authService.refreshAccessToken(refreshToken);

      return sendSuccess(res, 200, 'Token refreshed successfully', result);
    } catch (error) {
      console.error('Refresh token error:', error);
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      return sendError(res, 401, message);
    }
  }
}

export default new AuthController();