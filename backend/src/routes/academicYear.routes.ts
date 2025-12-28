import { Router } from 'express';
import academicYearController from '../controllers/academicYear.controller';
import { authenticate, isSchoolAdmin } from '../middleware/auth.middleware';

const router = Router();

// All academic year routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/schools/:schoolId/academic-years
 * @desc    Get all academic years for a school
 * @access  Private
 */
router.get('/schools/:schoolId/academic-years', academicYearController.getAcademicYearsBySchool.bind(academicYearController));

/**
 * @route   GET /api/v1/schools/:schoolId/academic-years/current
 * @desc    Get current academic year for a school
 * @access  Private
 */
router.get('/schools/:schoolId/academic-years/current', academicYearController.getCurrentAcademicYear.bind(academicYearController));

/**
 * @route   GET /api/v1/schools/:schoolId/current-term
 * @desc    Get current term for a school
 * @access  Private
 */
router.get('/schools/:schoolId/current-term', academicYearController.getCurrentTerm.bind(academicYearController));

/**
 * @route   POST /api/v1/schools/:schoolId/academic-years
 * @desc    Create new academic year
 * @access  Private (Admin only)
 */
router.post('/schools/:schoolId/academic-years', isSchoolAdmin, academicYearController.createAcademicYear.bind(academicYearController));

/**
 * @route   GET /api/v1/academic-years/:id
 * @desc    Get academic year by ID
 * @access  Private
 */
router.get('/academic-years/:id', academicYearController.getAcademicYearById.bind(academicYearController));

/**
 * @route   PUT /api/v1/academic-years/:id
 * @desc    Update academic year
 * @access  Private (Admin only)
 */
router.put('/academic-years/:id', isSchoolAdmin, academicYearController.updateAcademicYear.bind(academicYearController));

/**
 * @route   PATCH /api/v1/academic-years/:id/set-current
 * @desc    Set current academic year
 * @access  Private (Admin only)
 */
router.patch('/academic-years/:id/set-current', isSchoolAdmin, academicYearController.setCurrentAcademicYear.bind(academicYearController));

/**
 * @route   DELETE /api/v1/academic-years/:id
 * @desc    Delete academic year
 * @access  Private (Admin only)
 */
router.delete('/academic-years/:id', isSchoolAdmin, academicYearController.deleteAcademicYear.bind(academicYearController));

// ==================== TERM ROUTES ====================

/**
 * @route   POST /api/v1/academic-years/:academicYearId/terms
 * @desc    Create new term
 * @access  Private (Admin only)
 */
router.post('/academic-years/:academicYearId/terms', isSchoolAdmin, academicYearController.createTerm.bind(academicYearController));

/**
 * @route   PUT /api/v1/terms/:id
 * @desc    Update term
 * @access  Private (Admin only)
 */
router.put('/terms/:id', isSchoolAdmin, academicYearController.updateTerm.bind(academicYearController));

/**
 * @route   PATCH /api/v1/terms/:id/set-current
 * @desc    Set current term
 * @access  Private (Admin only)
 */
router.patch('/terms/:id/set-current', isSchoolAdmin, academicYearController.setCurrentTerm.bind(academicYearController));

/**
 * @route   DELETE /api/v1/terms/:id
 * @desc    Delete term
 * @access  Private (Admin only)
 */
router.delete('/terms/:id', isSchoolAdmin, academicYearController.deleteTerm.bind(academicYearController));

export default router;