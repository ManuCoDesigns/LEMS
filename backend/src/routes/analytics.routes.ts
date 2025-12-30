import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/students/:studentId/analytics
 * @desc    Get student performance analytics
 * @access  Private
 */
router.get('/students/:studentId/analytics', analyticsController.getStudentPerformance.bind(analyticsController));

/**
 * @route   GET /api/v1/classes/:classId/analytics
 * @desc    Get class performance analytics
 * @access  Private
 */
router.get('/classes/:classId/analytics', analyticsController.getClassPerformance.bind(analyticsController));

/**
 * @route   GET /api/v1/subjects/:subjectId/analytics
 * @desc    Get subject performance analytics
 * @access  Private
 */
router.get('/subjects/:subjectId/analytics', analyticsController.getSubjectPerformance.bind(analyticsController));

/**
 * @route   GET /api/v1/classes/:classId/analytics/attendance
 * @desc    Get attendance trends
 * @access  Private
 */
router.get('/classes/:classId/analytics/attendance', analyticsController.getAttendanceTrends.bind(analyticsController));

/**
 * @route   GET /api/v1/classes/:classId/analytics/assignments
 * @desc    Get assignment completion analytics
 * @access  Private
 */
router.get('/classes/:classId/analytics/assignments', analyticsController.getAssignmentCompletion.bind(analyticsController));

/**
 * @route   GET /api/v1/exams/:examId/analytics
 * @desc    Get exam results analytics
 * @access  Private
 */
router.get('/exams/:examId/analytics', analyticsController.getExamResults.bind(analyticsController));

export default router;