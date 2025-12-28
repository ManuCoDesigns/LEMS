import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);

// Future routes will be added here
// router.use('/users', userRoutes);
// router.use('/schools', schoolRoutes);
// router.use('/courses', courseRoutes);
// etc...

export default router;