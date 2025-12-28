import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import schoolRoutes from './school.routes';
import departmentRoutes from './department.routes';
import academicYearRoutes from './academicYear.routes';
import classRoutes from './class.routes';
import subjectRoutes from './subject.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/', departmentRoutes); // Departments use nested routes
router.use('/', academicYearRoutes); // Academic years use nested routes
router.use('/', classRoutes); // Classes use nested routes
router.use('/', subjectRoutes); // Subjects use nested routes

// Future routes will be added here
// router.use('/exams', examRoutes);
// router.use('/assignments', assignmentRoutes);
// etc...

export default router;