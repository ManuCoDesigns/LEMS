import { Router } from 'express';
import gradeController from '../controllers/grade.controller';
import { authenticate, isTeacher } from '../middleware/auth.middleware';

const router = Router();

// All grade routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/grading-schemes
 * @desc    Create grading scheme
 * @access  Private (Admin only)
 */
router.post('/grading-schemes', isTeacher, gradeController.createGradingScheme.bind(gradeController));

/**
 * @route   GET /api/v1/schools/:schoolId/grading-schemes
 * @desc    Get school grading schemes
 * @access  Private
 */
router.get('/schools/:schoolId/grading-schemes', gradeController.getSchoolGradingSchemes.bind(gradeController));

/**
 * @route   GET /api/v1/grading-schemes/:id
 * @desc    Get grading scheme by ID
 * @access  Private
 */
router.get('/grading-schemes/:id', gradeController.getGradingSchemeById.bind(gradeController));

/**
 * @route   PUT /api/v1/grading-schemes/:id
 * @desc    Update grading scheme
 * @access  Private (Admin only)
 */
router.put('/grading-schemes/:id', isTeacher, gradeController.updateGradingScheme.bind(gradeController));

/**
 * @route   DELETE /api/v1/grading-schemes/:id
 * @desc    Delete grading scheme
 * @access  Private (Admin only)
 */
router.delete('/grading-schemes/:id', isTeacher, gradeController.deleteGradingScheme.bind(gradeController));

/**
 * @route   POST /api/v1/grades/calculate
 * @desc    Calculate grade for a student in a subject
 * @access  Private (Teacher/Admin only)
 */
router.post('/grades/calculate', isTeacher, gradeController.calculateGrade.bind(gradeController));

/**
 * @route   POST /api/v1/students/:studentId/grades/calculate-all
 * @desc    Calculate all grades for a student
 * @access  Private (Teacher/Admin only)
 */
router.post('/students/:studentId/grades/calculate-all', isTeacher, gradeController.calculateAllGrades.bind(gradeController));

/**
 * @route   GET /api/v1/students/:studentId/grades
 * @desc    Get student grades
 * @access  Private
 */
router.get('/students/:studentId/grades', gradeController.getStudentGrades.bind(gradeController));

/**
 * @route   GET /api/v1/classes/:classId/grades
 * @desc    Get class grades
 * @access  Private
 */
router.get('/classes/:classId/grades', gradeController.getClassGrades.bind(gradeController));

/**
 * @route   POST /api/v1/report-cards/generate
 * @desc    Generate report card
 * @access  Private (Teacher/Admin only)
 */
router.post('/report-cards/generate', isTeacher, gradeController.generateReportCard.bind(gradeController));

/**
 * @route   GET /api/v1/report-cards/:id
 * @desc    Get report card
 * @access  Private
 */
router.get('/report-cards/:id', gradeController.getReportCard.bind(gradeController));

/**
 * @route   PATCH /api/v1/report-cards/:id/publish
 * @desc    Publish report card
 * @access  Private (Teacher/Admin only)
 */
router.patch('/report-cards/:id/publish', isTeacher, gradeController.publishReportCard.bind(gradeController));

/**
 * @route   GET /api/v1/students/:studentId/transcript
 * @desc    Get student transcript
 * @access  Private
 */
router.get('/students/:studentId/transcript', gradeController.getStudentTranscript.bind(gradeController));

/**
 * @route   POST /api/v1/students/:studentId/transcript/update
 * @desc    Update transcript
 * @access  Private (Teacher/Admin only)
 */
router.post('/students/:studentId/transcript/update', isTeacher, gradeController.updateTranscript.bind(gradeController));

export default router;