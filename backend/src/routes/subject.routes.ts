import { Router } from 'express';
import subjectController from '../controllers/subject.controller';
import { authenticate, isSchoolAdmin } from '../middleware/auth.middleware';

const router = Router();

// All subject routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/subjects/stats
 * @desc    Get subject statistics
 * @access  Private (Admin only)
 */
router.get('/subjects/stats', isSchoolAdmin, subjectController.getSubjectStats.bind(subjectController));

/**
 * @route   GET /api/v1/schools/:schoolId/subjects
 * @desc    Get all subjects for a school
 * @access  Private
 */
router.get('/schools/:schoolId/subjects', subjectController.getSubjectsBySchool.bind(subjectController));

/**
 * @route   POST /api/v1/schools/:schoolId/subjects
 * @desc    Create new subject
 * @access  Private (Admin only)
 */
router.post('/schools/:schoolId/subjects', isSchoolAdmin, subjectController.createSubject.bind(subjectController));

/**
 * @route   GET /api/v1/subjects/:id
 * @desc    Get subject by ID
 * @access  Private
 */
router.get('/subjects/:id', subjectController.getSubjectById.bind(subjectController));

/**
 * @route   PUT /api/v1/subjects/:id
 * @desc    Update subject
 * @access  Private (Admin only)
 */
router.put('/subjects/:id', isSchoolAdmin, subjectController.updateSubject.bind(subjectController));

/**
 * @route   DELETE /api/v1/subjects/:id
 * @desc    Delete subject
 * @access  Private (Admin only)
 */
router.delete('/subjects/:id', isSchoolAdmin, subjectController.deleteSubject.bind(subjectController));

/**
 * @route   POST /api/v1/subjects/:id/teachers
 * @desc    Assign teacher to subject
 * @access  Private (Admin only)
 */
router.post('/subjects/:id/teachers', isSchoolAdmin, subjectController.assignTeacher.bind(subjectController));

/**
 * @route   DELETE /api/v1/subjects/:id/teachers/:teacherId
 * @desc    Remove teacher from subject
 * @access  Private (Admin only)
 */
router.delete('/subjects/:id/teachers/:teacherId', isSchoolAdmin, subjectController.removeTeacher.bind(subjectController));

/**
 * @route   GET /api/v1/teachers/:teacherId/subjects
 * @desc    Get subjects by teacher
 * @access  Private
 */
router.get('/teachers/:teacherId/subjects', subjectController.getSubjectsByTeacher.bind(subjectController));

export default router;