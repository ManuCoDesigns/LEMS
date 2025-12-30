import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import schoolRoutes from './school.routes';
import departmentRoutes from './department.routes';
import academicYearRoutes from './academicYear.routes';
import classRoutes from './class.routes';
import subjectRoutes from './subject.routes';
import attendanceRoutes from './attendance.routes';
import assignmentRoutes from './assignment.routes';
import examRoutes from './exam.routes';
import gradeRoutes from './grade.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notification.routes';
import financeRoutes from './finance.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/', departmentRoutes);
router.use('/', academicYearRoutes);
router.use('/', classRoutes);
router.use('/', subjectRoutes);
router.use('/', attendanceRoutes);
router.use('/', assignmentRoutes);
router.use('/', examRoutes);
router.use('/', gradeRoutes);
router.use('/', analyticsRoutes);
router.use('/', notificationRoutes);
router.use('/', financeRoutes);

export default router;