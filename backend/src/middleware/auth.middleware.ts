import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.util';
import { sendError } from '../utils/response.util';
import { UserRole } from '@prisma/client';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            sendError(res, 401, 'Access token is required', 'No token provided');
            return;
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach user info to request
        req.user = decoded;

        // Continue to next middleware/controller
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        const message = error instanceof Error ? error.message : 'Authentication failed';
        sendError(res, 401, 'Authentication failed', message);
        return;
    }
};

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of allowed roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                sendError(res, 401, 'Authentication required');
                return;
            }

            // Check if user's role is in allowed roles
            const userRole = req.user.role as UserRole;

            if (!allowedRoles.includes(userRole)) {
                sendError(
                    res,
                    403,
                    'Access forbidden',
                    `This action requires one of these roles: ${allowedRoles.join(', ')}`
                );
                return;
            }

            // User is authorized
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            sendError(res, 403, 'Authorization failed');
            return;
        }
    };
};

/**
 * Middleware to check if user is Super Admin
 */
export const isSuperAdmin = authorize(UserRole.SUPER_ADMIN);

/**
 * Middleware to check if user is School Admin or Super Admin
 */
export const isSchoolAdmin = authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN);

/**
 * Middleware to check if user is Teacher, School Admin, or Super Admin
 */
export const isTeacher = authorize(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER
);

/**
 * Middleware to check if user is authenticated (any role)
 */
export const isAuthenticated = authenticate;