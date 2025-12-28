import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.config';

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

/**
 * Generate access token
 * @param payload - User data to encode in token
 * @returns Access token string
 */
export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY,
    } as SignOptions);
};

/**
 * Generate refresh token
 * @param payload - User data to encode in token
 * @returns Refresh token string
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY,
    } as SignOptions);
};

/**
 * Verify access token
 * @param token - JWT token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid
 */
export const verifyAccessToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

/**
 * Verify refresh token
 * @param token - JWT token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Generate both access and refresh tokens
 * @param payload - User data to encode
 * @returns Object with both tokens
 */
export const generateTokens = (payload: JwtPayload) => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};