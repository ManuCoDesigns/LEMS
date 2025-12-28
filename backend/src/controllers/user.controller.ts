import { Request, Response } from 'express';
import userService from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { UserRole, UserStatus, Gender } from '@prisma/client';

class UserController {
    /**
     * Get all users
     * GET /api/v1/users
     */
    async getAllUsers(req: Request, res: Response) {
        try {
            const { role, status, search, page = '1', limit = '10' } = req.query;

            const filters = {
                role: role as UserRole,
                status: status as UserStatus,
                search: search as string,
            };

            const result = await userService.getAllUsers(
                filters,
                parseInt(page as string),
                parseInt(limit as string)
            );

            return sendSuccess(res, 200, 'Users retrieved successfully', result);
        } catch (error) {
            console.error('Get all users error:', error);
            return sendError(res, 500, 'Failed to retrieve users');
        }
    }

    /**
     * Get user by ID
     * GET /api/v1/users/:id
     */
    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const user = await userService.getUserById(id);

            return sendSuccess(res, 200, 'User retrieved successfully', { user });
        } catch (error) {
            console.error('Get user error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve user';
            return sendError(res, 404, message);
        }
    }

    /**
     * Create new user
     * POST /api/v1/users
     */
    async createUser(req: Request, res: Response) {
        try {
            const {
                email,
                password,
                firstName,
                lastName,
                middleName,
                role,
                dateOfBirth,
                gender,
                phone,
                address,
                city,
                state,
                country,
                postalCode,
            } = req.body;

            // Validate required fields
            if (!email || !password || !firstName || !lastName || !role) {
                return sendError(
                    res,
                    400,
                    'Missing required fields',
                    'Email, password, firstName, lastName, and role are required'
                );
            }

            const user = await userService.createUser({
                email,
                password,
                firstName,
                lastName,
                middleName,
                role,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                phone,
                address,
                city,
                state,
                country,
                postalCode,
            });

            return sendSuccess(res, 201, 'User created successfully', { user });
        } catch (error) {
            console.error('Create user error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create user';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update user
     * PUT /api/v1/users/:id
     */
    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                firstName,
                lastName,
                middleName,
                dateOfBirth,
                gender,
                phone,
                address,
                city,
                state,
                country,
                postalCode,
                avatar,
            } = req.body;

            const user = await userService.updateUser(id, {
                firstName,
                lastName,
                middleName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                phone,
                address,
                city,
                state,
                country,
                postalCode,
                avatar,
            });

            return sendSuccess(res, 200, 'User updated successfully', { user });
        } catch (error) {
            console.error('Update user error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update user';
            return sendError(res, 400, message);
        }
    }

    /**
     * Change user password
     * PUT /api/v1/users/:id/password
     */
    async changePassword(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword) {
                return sendError(res, 400, 'New password is required');
            }

            await userService.changePassword(id, newPassword);

            return sendSuccess(res, 200, 'Password changed successfully');
        } catch (error) {
            console.error('Change password error:', error);
            const message = error instanceof Error ? error.message : 'Failed to change password';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update user status
     * PATCH /api/v1/users/:id/status
     */
    async updateUserStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !Object.values(UserStatus).includes(status)) {
                return sendError(res, 400, 'Valid status is required');
            }

            const user = await userService.updateUserStatus(id, status);

            return sendSuccess(res, 200, 'User status updated successfully', { user });
        } catch (error) {
            console.error('Update status error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update status';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete user
     * DELETE /api/v1/users/:id
     */
    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await userService.deleteUser(id);

            return sendSuccess(res, 200, 'User deleted successfully');
        } catch (error) {
            console.error('Delete user error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete user';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get user statistics
     * GET /api/v1/users/stats
     */
    async getUserStats(req: Request, res: Response) {
        try {
            const stats = await userService.getUserStats();

            return sendSuccess(res, 200, 'Statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get stats error:', error);
            return sendError(res, 500, 'Failed to retrieve statistics');
        }
    }
}

export default new UserController();