import { User, UserRole, UserStatus, Gender } from '@prisma/client';
import prisma from '../config/database.config';
import { hashPassword, validatePasswordStrength } from '../utils/password.util';

export interface CreateUserInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: UserRole;
    dateOfBirth?: Date;
    gender?: Gender;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    avatar?: string;
}

export interface UserFilters {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
}

class UserService {
    /**
     * Get all users with optional filters
     */
    async getAllUsers(filters: UserFilters = {}, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const where: any = {};

        // Apply filters
        if (filters.role) {
            where.role = filters.role;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        // Search by name or email
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Get users and total count
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    role: true,
                    status: true,
                    dateOfBirth: true,
                    gender: true,
                    phone: true,
                    avatar: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                    postalCode: true,
                    emailVerified: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                middleName: true,
                role: true,
                status: true,
                dateOfBirth: true,
                gender: true,
                phone: true,
                avatar: true,
                address: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
                emailVerified: true,
                emailVerifiedAt: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Create new user (Admin only)
     */
    async createUser(data: CreateUserInput) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(data.password);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message);
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName,
                role: data.role,
                status: UserStatus.ACTIVE,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                phone: data.phone,
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                postalCode: data.postalCode,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                middleName: true,
                role: true,
                status: true,
                dateOfBirth: true,
                gender: true,
                phone: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Update user
     */
    async updateUser(userId: string, data: UpdateUserInput) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                middleName: true,
                role: true,
                status: true,
                dateOfBirth: true,
                gender: true,
                phone: true,
                avatar: true,
                address: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
                emailVerified: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Change user password
     */
    async changePassword(userId: string, newPassword: string) {
        // Validate password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message);
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }

    /**
     * Update user status
     */
    async updateUserStatus(userId: string, status: UserStatus) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { status },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
            },
        });

        return user;
    }

    /**
     * Delete user
     */
    async deleteUser(userId: string) {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Delete user
        await prisma.user.delete({
            where: { id: userId },
        });
    }

    /**
     * Get user statistics
     */
    async getUserStats() {
        const [total, active, inactive, suspended, byRole] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
            prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
            prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
            prisma.user.groupBy({
                by: ['role'],
                _count: true,
            }),
        ]);

        return {
            total,
            byStatus: {
                active,
                inactive,
                suspended,
            },
            byRole: byRole.reduce((acc, item) => {
                acc[item.role] = item._count;
                return acc;
            }, {} as Record<string, number>),
        };
    }
}

export default new UserService();