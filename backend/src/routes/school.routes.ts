import { Router } from 'express';
import schoolController from '../controllers/school.controller';
import { authenticate, isSuperAdmin, isSchoolAdmin } from '../middleware/auth.middleware';

const router = Router();

// All school routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/schools/my-schools
 * @desc    Get schools for current user
 * @access  Private
 */
router.get('/my-schools', schoolController.getMySchools.bind(schoolController));

/**
 * @route   GET /api/v1/schools/stats
 * @desc    Get global school statistics
 * @access  Private (Admin only)
 */
router.get('/stats', isSuperAdmin, schoolController.getSchoolStats.bind(schoolController));

/**
 * @route   GET /api/v1/schools/code/:code
 * @desc    Get school by code
 * @access  Private
 */
router.get('/code/:code', schoolController.getSchoolByCode.bind(schoolController));

/**
 * @route   GET /api/v1/schools/:id/stats
 * @desc    Get statistics for specific school
 * @access  Private (Admin only)
 */
router.get('/:id/stats', isSchoolAdmin, schoolController.getSchoolStats.bind(schoolController));

/**
 * @route   GET /api/v1/schools
 * @desc    Get all schools with filters and pagination
 * @access  Private (Super Admin only)
 */
router.get('/', isSuperAdmin, schoolController.getAllSchools.bind(schoolController));

/**
 * @route   GET /api/v1/schools/:id
 * @desc    Get school by ID
 * @access  Private
 */
router.get('/:id', schoolController.getSchoolById.bind(schoolController));

/**
 * @route   POST /api/v1/schools
 * @desc    Create new school
 * @access  Private (Super Admin only)
 */
router.post('/', isSuperAdmin, schoolController.createSchool.bind(schoolController));

/**
 * @route   PUT /api/v1/schools/:id
 * @desc    Update school
 * @access  Private (Super Admin only)
 */
router.put('/:id', isSuperAdmin, schoolController.updateSchool.bind(schoolController));

/**
 * @route   PATCH /api/v1/schools/:id/status
 * @desc    Update school status
 * @access  Private (Super Admin only)
 */
router.patch('/:id/status', isSuperAdmin, schoolController.updateSchoolStatus.bind(schoolController));

/**
 * @route   DELETE /api/v1/schools/:id
 * @desc    Delete school
 * @access  Private (Super Admin only)
 */
router.delete('/:id', isSuperAdmin, schoolController.deleteSchool.bind(schoolController));

export default router;