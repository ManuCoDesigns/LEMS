import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Future routes will be added here
// router.use('/schools', schoolRoutes);
// router.use('/courses', courseRoutes);
// etc...

export default router;