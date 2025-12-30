import { Request, Response } from 'express';
import financeService from '../services/finance.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { FeeCategory, PaymentMethod, PaymentStatus } from '@prisma/client';

class FinanceController {
    /**
     * Create fee structure
     * POST /api/v1/fee-structures
     */
    async createFeeStructure(req: Request, res: Response) {
        try {
            const { name, description, category, amount, isOptional, isRecurring, schoolId } = req.body;

            if (!name || !category || !amount || !schoolId) {
                return sendError(res, 400, 'Missing required fields');
            }

            const feeStructure = await financeService.createFeeStructure({
                name,
                description,
                category,
                amount: parseFloat(amount),
                isOptional,
                isRecurring,
                schoolId,
            });

            return sendSuccess(res, 201, 'Fee structure created successfully', { feeStructure });
        } catch (error) {
            console.error('Create fee structure error:', error);
            return sendError(res, 400, 'Failed to create fee structure');
        }
    }

    /**
     * Get school fee structures
     * GET /api/v1/schools/:schoolId/fee-structures
     */
    async getSchoolFeeStructures(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const { category } = req.query;

            const feeStructures = await financeService.getSchoolFeeStructures(
                schoolId,
                category as FeeCategory
            );

            return sendSuccess(res, 200, 'Fee structures retrieved successfully', { feeStructures });
        } catch (error) {
            console.error('Get fee structures error:', error);
            return sendError(res, 500, 'Failed to retrieve fee structures');
        }
    }

    /**
     * Get fee structure by ID
     * GET /api/v1/fee-structures/:id
     */
    async getFeeStructureById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const feeStructure = await financeService.getFeeStructureById(id);

            return sendSuccess(res, 200, 'Fee structure retrieved successfully', { feeStructure });
        } catch (error) {
            console.error('Get fee structure error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve fee structure';
            return sendError(res, 404, message);
        }
    }

    /**
     * Update fee structure
     * PUT /api/v1/fee-structures/:id
     */
    async updateFeeStructure(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            if (data.amount) data.amount = parseFloat(data.amount);

            const feeStructure = await financeService.updateFeeStructure(id, data);

            return sendSuccess(res, 200, 'Fee structure updated successfully', { feeStructure });
        } catch (error) {
            console.error('Update fee structure error:', error);
            return sendError(res, 400, 'Failed to update fee structure');
        }
    }

    /**
     * Delete fee structure
     * DELETE /api/v1/fee-structures/:id
     */
    async deleteFeeStructure(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await financeService.deleteFeeStructure(id);

            return sendSuccess(res, 200, 'Fee structure deleted successfully');
        } catch (error) {
            console.error('Delete fee structure error:', error);
            return sendError(res, 400, 'Failed to delete fee structure');
        }
    }

    /**
     * Assign fee to student
     * POST /api/v1/fee-assignments
     */
    async assignFee(req: Request, res: Response) {
        try {
            const {
                studentId,
                classId,
                feeStructureId,
                totalAmount,
                discountAmount,
                discountReason,
                dueDate,
                academicYear,
                term,
            } = req.body;

            if (!studentId || !feeStructureId || !totalAmount || !dueDate) {
                return sendError(res, 400, 'Missing required fields');
            }

            const assignment = await financeService.assignFee({
                studentId,
                classId,
                feeStructureId,
                totalAmount: parseFloat(totalAmount),
                discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
                discountReason,
                dueDate: new Date(dueDate),
                academicYear,
                term,
            });

            return sendSuccess(res, 201, 'Fee assigned successfully', { assignment });
        } catch (error) {
            console.error('Assign fee error:', error);
            return sendError(res, 400, 'Failed to assign fee');
        }
    }

    /**
     * Bulk assign fees to class
     * POST /api/v1/classes/:classId/assign-fees
     */
    async bulkAssignFeesToClass(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const { feeStructureId, dueDate, academicYear, term } = req.body;

            if (!feeStructureId || !dueDate) {
                return sendError(res, 400, 'Fee structure and due date are required');
            }

            const result = await financeService.bulkAssignFeesToClass(
                classId,
                feeStructureId,
                new Date(dueDate),
                academicYear,
                term
            );

            return sendSuccess(res, 201, 'Fees assigned to class successfully', result);
        } catch (error) {
            console.error('Bulk assign fees error:', error);
            const message = error instanceof Error ? error.message : 'Failed to assign fees';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get student fee assignments
     * GET /api/v1/students/:studentId/fee-assignments
     */
    async getStudentFeeAssignments(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const { status } = req.query;

            const assignments = await financeService.getStudentFeeAssignments(
                studentId,
                status as PaymentStatus
            );

            return sendSuccess(res, 200, 'Fee assignments retrieved successfully', { assignments });
        } catch (error) {
            console.error('Get fee assignments error:', error);
            return sendError(res, 500, 'Failed to retrieve fee assignments');
        }
    }

    /**
     * Get class fee assignments
     * GET /api/v1/classes/:classId/fee-assignments
     */
    async getClassFeeAssignments(req: Request, res: Response) {
        try {
            const { classId } = req.params;

            const assignments = await financeService.getClassFeeAssignments(classId);

            return sendSuccess(res, 200, 'Class fee assignments retrieved successfully', { assignments });
        } catch (error) {
            console.error('Get class fee assignments error:', error);
            return sendError(res, 500, 'Failed to retrieve fee assignments');
        }
    }

    /**
     * Record payment
     * POST /api/v1/payments
     */
    async recordPayment(req: Request, res: Response) {
        try {
            const {
                studentId,
                feeAssignmentId,
                amount,
                paymentMethod,
                paymentDate,
                transactionRef,
                bankName,
                accountNumber,
                chequeNumber,
                mobileNumber,
                notes,
            } = req.body;

            const processedBy = req.user?.userId;

            if (!studentId || !feeAssignmentId || !amount || !paymentMethod) {
                return sendError(res, 400, 'Missing required fields');
            }

            const payment = await financeService.recordPayment({
                studentId,
                feeAssignmentId,
                amount: parseFloat(amount),
                paymentMethod,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
                transactionRef,
                bankName,
                accountNumber,
                chequeNumber,
                mobileNumber,
                notes,
                processedBy,
            });

            return sendSuccess(res, 201, 'Payment recorded successfully', { payment });
        } catch (error) {
            console.error('Record payment error:', error);
            const message = error instanceof Error ? error.message : 'Failed to record payment';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get student payments
     * GET /api/v1/students/:studentId/payments
     */
    async getStudentPayments(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            const payments = await financeService.getStudentPayments(studentId);

            return sendSuccess(res, 200, 'Payments retrieved successfully', { payments });
        } catch (error) {
            console.error('Get payments error:', error);
            return sendError(res, 500, 'Failed to retrieve payments');
        }
    }

    /**
     * Get payment by receipt
     * GET /api/v1/payments/receipt/:receiptNumber
     */
    async getPaymentByReceipt(req: Request, res: Response) {
        try {
            const { receiptNumber } = req.params;

            const payment = await financeService.getPaymentByReceipt(receiptNumber);

            return sendSuccess(res, 200, 'Payment retrieved successfully', { payment });
        } catch (error) {
            console.error('Get payment by receipt error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve payment';
            return sendError(res, 404, message);
        }
    }

    /**
     * Get student financial summary
     * GET /api/v1/students/:studentId/financial-summary
     */
    async getStudentFinancialSummary(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            const summary = await financeService.getStudentFinancialSummary(studentId);

            return sendSuccess(res, 200, 'Financial summary retrieved successfully', summary);
        } catch (error) {
            console.error('Get financial summary error:', error);
            return sendError(res, 500, 'Failed to retrieve financial summary');
        }
    }

    /**
     * Get school financial report
     * GET /api/v1/schools/:schoolId/financial-report
     */
    async getSchoolFinancialReport(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const { startDate, endDate } = req.query;

            const report = await financeService.getSchoolFinancialReport(
                schoolId,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );

            return sendSuccess(res, 200, 'Financial report retrieved successfully', report);
        } catch (error) {
            console.error('Get financial report error:', error);
            return sendError(res, 500, 'Failed to retrieve financial report');
        }
    }

    /**
     * Get defaulters
     * GET /api/v1/schools/:schoolId/defaulters
     */
    async getDefaulters(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;

            const defaulters = await financeService.getDefaulters(schoolId);

            return sendSuccess(res, 200, 'Defaulters retrieved successfully', { defaulters });
        } catch (error) {
            console.error('Get defaulters error:', error);
            return sendError(res, 500, 'Failed to retrieve defaulters');
        }
    }
}

export default new FinanceController();