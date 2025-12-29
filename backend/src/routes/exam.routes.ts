import { Router } from 'express';
import examController from '../controllers/exam.controller';
import { authenticate, isTeacher } from '../middleware/auth.middleware';

const router = Router();

// All exam routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/exams
 * @desc    Create new exam
 * @access  Private (Teacher/Admin only)
 */
router.post('/exams', isTeacher, examController.createExam.bind(examController));

/**
 * @route   GET /api/v1/classes/:classId/exams
 * @desc    Get all exams for a class
 * @access  Private
 */
router.get('/classes/:classId/exams', examController.getClassExams.bind(examController));

/**
 * @route   GET /api/v1/exams/:id
 * @desc    Get exam by ID
 * @access  Private
 */
router.get('/exams/:id', examController.getExamById.bind(examController));

/**
 * @route   PUT /api/v1/exams/:id
 * @desc    Update exam
 * @access  Private (Teacher/Admin only)
 */
router.put('/exams/:id', isTeacher, examController.updateExam.bind(examController));

/**
 * @route   PATCH /api/v1/exams/:id/status
 * @desc    Update exam status
 * @access  Private (Teacher/Admin only)
 */
router.patch('/exams/:id/status', isTeacher, examController.updateExamStatus.bind(examController));

/**
 * @route   DELETE /api/v1/exams/:id
 * @desc    Delete exam
 * @access  Private (Teacher/Admin only)
 */
router.delete('/exams/:id', isTeacher, examController.deleteExam.bind(examController));

/**
 * @route   POST /api/v1/exams/:id/questions
 * @desc    Add question to exam
 * @access  Private (Teacher/Admin only)
 */
router.post('/exams/:id/questions', isTeacher, examController.addQuestion.bind(examController));

/**
 * @route   GET /api/v1/exams/:id/questions
 * @desc    Get exam questions
 * @access  Private
 */
router.get('/exams/:id/questions', examController.getExamQuestions.bind(examController));

/**
 * @route   PUT /api/v1/questions/:id
 * @desc    Update question
 * @access  Private (Teacher/Admin only)
 */
router.put('/questions/:id', isTeacher, examController.updateQuestion.bind(examController));

/**
 * @route   DELETE /api/v1/questions/:id
 * @desc    Delete question
 * @access  Private (Teacher/Admin only)
 */
router.delete('/questions/:id', isTeacher, examController.deleteQuestion.bind(examController));

/**
 * @route   POST /api/v1/exams/:id/submit
 * @desc    Submit exam
 * @access  Private (Student)
 */
router.post('/exams/:id/submit', examController.submitExam.bind(examController));

/**
 * @route   GET /api/v1/exams/:id/result
 * @desc    Get student exam result
 * @access  Private (Student)
 */
router.get('/exams/:id/result', examController.getStudentResult.bind(examController));

/**
 * @route   GET /api/v1/exams/:id/results
 * @desc    Get all results for an exam
 * @access  Private (Teacher/Admin only)
 */
router.get('/exams/:id/results', isTeacher, examController.getExamResults.bind(examController));

/**
 * @route   POST /api/v1/answers/:id/grade
 * @desc    Grade subjective answer
 * @access  Private (Teacher/Admin only)
 */
router.post('/answers/:id/grade', isTeacher, examController.gradeAnswer.bind(examController));

/**
 * @route   GET /api/v1/exams/:id/stats
 * @desc    Get exam statistics
 * @access  Private
 */
router.get('/exams/:id/stats', examController.getExamStats.bind(examController));

export default router;