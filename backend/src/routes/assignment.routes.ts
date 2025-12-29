import { Router } from 'express';
import assignmentController from '../controllers/assignment.controller';
import { authenticate, isTeacher } from '../middleware/auth.middleware';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/assignments
 * @desc    Create new assignment
 * @access  Private (Teacher/Admin only)
 */
router.post('/assignments', isTeacher, assignmentController.createAssignment.bind(assignmentController));

/**
 * @route   GET /api/v1/classes/:classId/assignments
 * @desc    Get all assignments for a class
 * @access  Private
 */
router.get('/classes/:classId/assignments', assignmentController.getClassAssignments.bind(assignmentController));

/**
 * @route   GET /api/v1/classes/:classId/assignments/stats
 * @desc    Get class assignment statistics
 * @access  Private
 */
router.get('/classes/:classId/assignments/stats', assignmentController.getClassAssignmentStats.bind(assignmentController));

/**
 * @route   GET /api/v1/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private
 */
router.get('/assignments/:id', assignmentController.getAssignmentById.bind(assignmentController));

/**
 * @route   PUT /api/v1/assignments/:id
 * @desc    Update assignment
 * @access  Private (Teacher/Admin only)
 */
router.put('/assignments/:id', isTeacher, assignmentController.updateAssignment.bind(assignmentController));

/**
 * @route   PATCH /api/v1/assignments/:id/status
 * @desc    Update assignment status
 * @access  Private (Teacher/Admin only)
 */
router.patch('/assignments/:id/status', isTeacher, assignmentController.updateAssignmentStatus.bind(assignmentController));

/**
 * @route   DELETE /api/v1/assignments/:id
 * @desc    Delete assignment
 * @access  Private (Teacher/Admin only)
 */
router.delete('/assignments/:id', isTeacher, assignmentController.deleteAssignment.bind(assignmentController));

/**
 * @route   POST /api/v1/assignments/:id/submit
 * @desc    Submit assignment
 * @access  Private (Student)
 */
router.post('/assignments/:id/submit', assignmentController.submitAssignment.bind(assignmentController));

/**
 * @route   GET /api/v1/assignments/:id/stats
 * @desc    Get assignment statistics
 * @access  Private
 */
router.get('/assignments/:id/stats', assignmentController.getAssignmentStats.bind(assignmentController));

/**
 * @route   POST /api/v1/submissions/:id/grade
 * @desc    Grade submission
 * @access  Private (Teacher/Admin only)
 */
router.post('/submissions/:id/grade', isTeacher, assignmentController.gradeSubmission.bind(assignmentController));

/**
 * @route   GET /api/v1/students/:studentId/submissions
 * @desc    Get student submissions
 * @access  Private
 */
router.get('/students/:studentId/submissions', assignmentController.getStudentSubmissions.bind(assignmentController));

export default router;