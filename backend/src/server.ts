import app from './app';
import { env } from './config/env.config';

// Start the server
const PORT = env.PORT;

const server = app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 LEMS Backend Server Started!');
    console.log('='.repeat(50));
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Server running on: http://localhost:${PORT}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log('='.repeat(50));
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n📴 Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
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

export default server;