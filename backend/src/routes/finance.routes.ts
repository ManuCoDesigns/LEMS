import { Router } from 'express';
import financeController from '../controllers/finance.controller';
import { authenticate, isTeacher } from '../middleware/auth.middleware';

const router = Router();

// All finance routes require authentication
router.use(authenticate);

// ============================================
// FEE STRUCTURE ROUTES
// ============================================

/**
 * @route   POST /api/v1/fee-structures
 * @desc    Create fee structure
 * @access  Private (Admin only)
 */
router.post('/fee-structures', isTeacher, financeController.createFeeStructure.bind(financeController));

/**
 * @route   GET /api/v1/schools/:schoolId/fee-structures
 * @desc    Get school fee structures
 * @access  Private
 */
router.get('/schools/:schoolId/fee-structures', financeController.getSchoolFeeStructures.bind(financeController));

/**
 * @route   GET /api/v1/fee-structures/:id
 * @desc    Get fee structure by ID
 * @access  Private
 */
router.get('/fee-structures/:id', financeController.getFeeStructureById.bind(financeController));

/**
 * @route   PUT /api/v1/fee-structures/:id
 * @desc    Update fee structure
 * @access  Private (Admin only)
 */
router.put('/fee-structures/:id', isTeacher, financeController.updateFeeStructure.bind(financeController));

/**
 * @route   DELETE /api/v1/fee-structures/:id
 * @desc    Delete fee structure
 * @access  Private (Admin only)
 */
router.delete('/fee-structures/:id', isTeacher, financeController.deleteFeeStructure.bind(financeController));

// ============================================
// FEE ASSIGNMENT ROUTES
// ============================================

/**
 * @route   POST /api/v1/fee-assignments
 * @desc    Assign fee to student
 * @access  Private (Admin only)
 */
router.post('/fee-assignments', isTeacher, financeController.assignFee.bind(financeController));

/**
 * @route   POST /api/v1/classes/:classId/assign-fees
 * @desc    Bulk assign fees to class
 * @access  Private (Admin only)
 */
router.post('/classes/:classId/assign-fees', isTeacher, financeController.bulkAssignFeesToClass.bind(financeController));

/**
 * @route   GET /api/v1/students/:studentId/fee-assignments
 * @desc    Get student fee assignments
 * @access  Private
 */
router.get('/students/:studentId/fee-assignments', financeController.getStudentFeeAssignments.bind(financeController));

/**
 * @route   GET /api/v1/classes/:classId/fee-assignments
 * @desc    Get class fee assignments
 * @access  Private
 */
router.get('/classes/:classId/fee-assignments', financeController.getClassFeeAssignments.bind(financeController));

// ============================================
// PAYMENT ROUTES
// ============================================

/**
 * @route   POST /api/v1/payments
 * @desc    Record payment
 * @access  Private (Admin only)
 */
router.post('/payments', isTeacher, financeController.recordPayment.bind(financeController));

/**
 * @route   GET /api/v1/students/:studentId/payments
 * @desc    Get student payments
 * @access  Private
 */
router.get('/students/:studentId/payments', financeController.getStudentPayments.bind(financeController));

/**
 * @route   GET /api/v1/payments/receipt/:receiptNumber
 * @desc    Get payment by receipt number
 * @access  Private
 */
router.get('/payments/receipt/:receiptNumber', financeController.getPaymentByReceipt.bind(financeController));

// ============================================
// FINANCIAL REPORTS ROUTES
// ============================================

/**
 * @route   GET /api/v1/students/:studentId/financial-summary
 * @desc    Get student financial summary
 * @access  Private
 */
router.get('/students/:studentId/financial-summary', financeController.getStudentFinancialSummary.bind(financeController));

/**
 * @route   GET /api/v1/schools/:schoolId/financial-report
 * @desc    Get school financial report
 * @access  Private (Admin only)
 */
router.get('/schools/:schoolId/financial-report', isTeacher, financeController.getSchoolFinancialReport.bind(financeController));

/**
 * @route   GET /api/v1/schools/:schoolId/defaulters
 * @desc    Get fee defaulters
 * @access  Private (Admin only)
 */
router.get('/schools/:schoolId/defaulters', isTeacher, financeController.getDefaulters.bind(financeController));

export default router;