import { Router } from 'express';
import classController from '../controllers/class.controller';
import { authenticate, isSchoolAdmin } from '../middleware/auth.middleware';

const router = Router();

// All class routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/schools/:schoolId/classes
 * @desc    Get all classes for a school
 * @access  Private
 */
router.get('/schools/:schoolId/classes', classController.getClassesBySchool.bind(classController));

/**
 * @route   POST /api/v1/schools/:schoolId/classes
 * @desc    Create new class
 * @access  Private (Admin only)
 */
router.post('/schools/:schoolId/classes', isSchoolAdmin, classController.createClass.bind(classController));

/**
 * @route   GET /api/v1/classes/:id
 * @desc    Get class by ID
 * @access  Private
 */
router.get('/classes/:id', classController.getClassById.bind(classController));

/**
 * @route   PUT /api/v1/classes/:id
 * @desc    Update class
 * @access  Private (Admin only)
 */
router.put('/classes/:id', isSchoolAdmin, classController.updateClass.bind(classController));

/**
 * @route   DELETE /api/v1/classes/:id
 * @desc    Delete class
 * @access  Private (Admin only)
 */
router.delete('/classes/:id', isSchoolAdmin, classController.deleteClass.bind(classController));

/**
 * @route   POST /api/v1/classes/:id/subjects
 * @desc    Assign subject to class
 * @access  Private (Admin only)
 */
router.post('/classes/:id/subjects', isSchoolAdmin, classController.assignSubject.bind(classController));

/**
 * @route   DELETE /api/v1/classes/:id/subjects/:subjectId
 * @desc    Remove subject from class
 * @access  Private (Admin only)
 */
router.delete('/classes/:id/subjects/:subjectId', isSchoolAdmin, classController.removeSubject.bind(classController));

/**
 * @route   POST /api/v1/classes/:id/teachers
 * @desc    Assign teacher to class
 * @access  Private (Admin only)
 */
router.post('/classes/:id/teachers', isSchoolAdmin, classController.assignTeacher.bind(classController));

/**
 * @route   DELETE /api/v1/classes/:id/teachers/:teacherId
 * @desc    Remove teacher from class
 * @access  Private (Admin only)
 */
router.delete('/classes/:id/teachers/:teacherId', isSchoolAdmin, classController.removeTeacher.bind(classController));

/**
 * @route   POST /api/v1/classes/:id/students
 * @desc    Enroll student in class
 * @access  Private (Admin only)
 */
router.post('/classes/:id/students', isSchoolAdmin, classController.enrollStudent.bind(classController));

/**
 * @route   DELETE /api/v1/students/:studentId/class
 * @desc    Remove student from class
 * @access  Private (Admin only)
 */
router.delete('/students/:studentId/class', isSchoolAdmin, classController.removeStudent.bind(classController));

export default router;