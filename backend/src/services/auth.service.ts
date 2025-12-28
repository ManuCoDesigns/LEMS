import { User, UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/database.config';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.util';
import { generateTokens, JwtPayload } from '../utils/jwt.util';

export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: Omit<User, 'password' | 'refreshToken'>;
    accessToken: string;
    refreshToken: string;
}

class AuthService {
    /**
     * Register a new user
     */
    async register(data: RegisterInput): Promise<AuthResponse> {
        const { email, password, firstName, lastName, role = UserRole.STUDENT } = data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message);
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                firstName,
                lastName,
                role,
                status: UserStatus.ACTIVE, // Auto-activate for now, we'll add email verification later
            },
        });

        // Generate tokens
        const tokenPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const tokens = generateTokens(tokenPayload);

        // Store refresh token in database
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken },
        });

        // Remove sensitive data
        const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;

        return {
            user: userWithoutSensitiveData,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    /**
     * Login user
     */
    async login(data: LoginInput): Promise<AuthResponse> {
        const { email, password } = data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (user.status !== UserStatus.ACTIVE) {
            throw new Error(`Account is ${user.status.toLowerCase()}. Please contact support.`);
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const tokenPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const tokens = generateTokens(tokenPayload);

        // Update refresh token and last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: tokens.refreshToken,
                lastLogin: new Date(),
            },
        });

        // Remove sensitive data
        const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;

        return {
            user: userWithoutSensitiveData,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    /**
     * Logout user (invalidate refresh token)
     */
    async logout(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<Omit<User, 'password' | 'refreshToken'> | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return null;
        }

        const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;
        return userWithoutSensitiveData;
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        // This will be implemented when we create the auth middleware
        throw new Error('Not implemented yet');
    }
}

export default new AuthService();