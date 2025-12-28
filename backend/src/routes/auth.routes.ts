import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private (requires authentication)
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticate, authController.getProfile.bind(authController));

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh', authController.refreshToken.bind(authController));

export default router;