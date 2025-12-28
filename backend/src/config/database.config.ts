import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './env.config';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Prisma Client singleton
declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma Client instance with adapter
export const prisma = globalThis.prisma || new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

// In development, save the instance to global to prevent multiple instances
if (env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Database connection test
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    await pool.end(); // Close the connection pool
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

export default prisma;