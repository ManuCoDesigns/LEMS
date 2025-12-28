import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, isSuperAdmin, isSchoolAdmin } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', isSchoolAdmin, userController.getUserStats.bind(userController));

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with filters and pagination
 * @access  Private (Admin only)
 */
router.get('/', isSchoolAdmin, userController.getAllUsers.bind(userController));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', isSchoolAdmin, userController.getUserById.bind(userController));

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', isSchoolAdmin, userController.createUser.bind(userController));

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', isSchoolAdmin, userController.updateUser.bind(userController));

/**
 * @route   PUT /api/v1/users/:id/password
 * @desc    Change user password
 * @access  Private (Super Admin only)
 */
router.put('/:id/password', isSuperAdmin, userController.changePassword.bind(userController));

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Update user status (activate/deactivate/suspend)
 * @access  Private (Admin only)
 */
router.patch('/:id/status', isSchoolAdmin, userController.updateUserStatus.bind(userController));

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (Super Admin only)
 */
router.delete('/:id', isSuperAdmin, userController.deleteUser.bind(userController));

export default router;