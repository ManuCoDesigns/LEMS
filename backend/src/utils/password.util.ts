import bcrypt from 'bcryptjs';
import { env } from '../config/env.config';

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    message: string;
} => {
    // Minimum 8 characters
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long',
        };
    }

    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter',
        };
    }

    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one lowercase letter',
        };
    }

    // Must contain at least one number
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one number',
        };
    }

    // Must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one special character',
        };
    }

    return {
        isValid: true,
        message: 'Password is strong',
    };
};