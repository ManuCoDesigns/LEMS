import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';

// Create Express app
const app: Application = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware - sets various HTTP headers
app.use(helmet());

// CORS - allow cross-origin requests
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));

// Body parser middleware - parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// HTTP request logger (only in development)
if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'LEMS API is running!',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
    });
});

// API root endpoint
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to LEMS API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api/v1',
        },
    });
});

// API v1 routes will go here
// app.use('/api/v1', routes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - route not found
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.stack);

    res.status(500).json({
        success: false,
        message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;