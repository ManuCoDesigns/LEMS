import { Router } from 'express';
import departmentController from '../controllers/department.controller';
import { authenticate, isSchoolAdmin } from '../middleware/auth.middleware';

const router = Router();

// All department routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/schools/:schoolId/departments
 * @desc    Get all departments for a school
 * @access  Private
 */
router.get('/schools/:schoolId/departments', departmentController.getDepartmentsBySchool.bind(departmentController));

/**
 * @route   POST /api/v1/schools/:schoolId/departments
 * @desc    Create new department
 * @access  Private (Admin only)
 */
router.post('/schools/:schoolId/departments', isSchoolAdmin, departmentController.createDepartment.bind(departmentController));

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Get department by ID
 * @access  Private
 */
router.get('/departments/:id', departmentController.getDepartmentById.bind(departmentController));

/**
 * @route   PUT /api/v1/departments/:id
 * @desc    Update department
 * @access  Private (Admin only)
 */
router.put('/departments/:id', isSchoolAdmin, departmentController.updateDepartment.bind(departmentController));

/**
 * @route   DELETE /api/v1/departments/:id
 * @desc    Delete department
 * @access  Private (Admin only)
 */
router.delete('/departments/:id', isSchoolAdmin, departmentController.deleteDepartment.bind(departmentController));

export default router;