import { Router } from 'express';
import attendanceController from '../controllers/attendance.controller';
import { authenticate, isTeacher } from '../middleware/auth.middleware';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/attendance
 * @desc    Mark attendance for a single student
 * @access  Private (Teacher/Admin only)
 */
router.post('/attendance', isTeacher, attendanceController.markAttendance.bind(attendanceController));

/**
 * @route   POST /api/v1/attendance/bulk
 * @desc    Mark bulk attendance for a class
 * @access  Private (Teacher/Admin only)
 */
router.post('/attendance/bulk', isTeacher, attendanceController.markBulkAttendance.bind(attendanceController));

/**
 * @route   GET /api/v1/classes/:classId/attendance
 * @desc    Get attendance for a class on a specific date
 * @access  Private
 */
router.get('/classes/:classId/attendance', attendanceController.getClassAttendance.bind(attendanceController));

/**
 * @route   GET /api/v1/classes/:classId/attendance/stats
 * @desc    Get class attendance statistics
 * @access  Private
 */
router.get('/classes/:classId/attendance/stats', attendanceController.getClassAttendanceStats.bind(attendanceController));

/**
 * @route   GET /api/v1/classes/:classId/attendance/report
 * @desc    Get attendance report for date range
 * @access  Private
 */
router.get('/classes/:classId/attendance/report', attendanceController.getAttendanceReport.bind(attendanceController));

/**
 * @route   GET /api/v1/students/:studentId/attendance
 * @desc    Get attendance for a student
 * @access  Private
 */
router.get('/students/:studentId/attendance', attendanceController.getStudentAttendance.bind(attendanceController));

/**
 * @route   GET /api/v1/students/:studentId/attendance/summary
 * @desc    Get attendance summary for a student
 * @access  Private
 */
router.get('/students/:studentId/attendance/summary', attendanceController.getStudentAttendanceSummary.bind(attendanceController));

/**
 * @route   DELETE /api/v1/attendance/:id
 * @desc    Delete attendance record
 * @access  Private (Teacher/Admin only)
 */
router.delete('/attendance/:id', isTeacher, attendanceController.deleteAttendance.bind(attendanceController));

export default router;