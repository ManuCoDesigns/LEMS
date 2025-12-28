import app from './app';
import { env } from './config/env.config';
import { connectDatabase, disconnectDatabase } from './config/database.config';

// Start the server
const PORT = env.PORT;

const startServer = async () => {
    try {
        // Connect to database first
        await connectDatabase();

        // Then start the server
        const server = app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('🚀 LEMS Backend Server Started!');
            console.log('='.repeat(50));
            console.log(`📍 Environment: ${env.NODE_ENV}`);
            console.log(`🌐 Server running on: http://localhost:${PORT}`);
            console.log(`❤️  Health check: http://localhost:${PORT}/health`);
            console.log(`🗄️  Database: Connected to PostgreSQL`);
            console.log('='.repeat(50));
        });

        // Graceful shutdown
        const gracefulShutdown = async () => {
            console.log('\n📴 Shutting down gracefully...');

            // Close server
            server.close(async () => {
                console.log('✅ Server closed');

                // Disconnect from database
                await disconnectDatabase();

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err: Error) => {
            console.error('❌ Unhandled Rejection:', err);
            gracefulShutdown();
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

export default app;