import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: number;
    CLIENT_URL: string;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    BCRYPT_ROUNDS: number;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
};

export const env: EnvConfig = {
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    PORT: parseInt(getEnvVar('PORT', '5000'), 10),
    CLIENT_URL: getEnvVar('CLIENT_URL', 'http://localhost:3000'),
    DATABASE_URL: getEnvVar('DATABASE_URL'),
    JWT_ACCESS_SECRET: getEnvVar('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRY: getEnvVar('JWT_ACCESS_EXPIRY', '15m'),
    JWT_REFRESH_EXPIRY: getEnvVar('JWT_REFRESH_EXPIRY', '7d'),
    BCRYPT_ROUNDS: parseInt(getEnvVar('BCRYPT_ROUNDS', '10'), 10),
};

export default env;