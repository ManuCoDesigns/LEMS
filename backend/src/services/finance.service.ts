import { FeeCategory, PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateFeeStructureInput {
    name: string;
    description?: string;
    category: FeeCategory;
    amount: number;
    isOptional?: boolean;
    isRecurring?: boolean;
    schoolId: string;
}

export interface AssignFeeInput {
    studentId: string;
    classId?: string;
    feeStructureId: string;
    totalAmount: number;
    discountAmount?: number;
    discountReason?: string;
    dueDate: Date;
    academicYear?: string;
    term?: string;
}

export interface RecordPaymentInput {
    studentId: string;
    feeAssignmentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: Date;
    transactionRef?: string;
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    mobileNumber?: string;
    notes?: string;
    processedBy?: string;
}

class FinanceService {
    /**
     * Create fee structure
     */
    async createFeeStructure(data: CreateFeeStructureInput) {
        return await prisma.feeStructure.create({
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                amount: data.amount,
                isOptional: data.isOptional ?? false,
                isRecurring: data.isRecurring ?? true,
                schoolId: data.schoolId,
            },
        });
    }

    /**
     * Get school fee structures
     */
    async getSchoolFeeStructures(schoolId: string, category?: FeeCategory) {
        const where: any = { schoolId };
        if (category) where.category = category;

        return await prisma.feeStructure.findMany({
            where,
            orderBy: { category: 'asc' },
        });
    }

    /**
     * Get fee structure by ID
     */
    async getFeeStructureById(id: string) {
        const feeStructure = await prisma.feeStructure.findUnique({
            where: { id },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        assignments: true,
                    },
                },
            },
        });

        if (!feeStructure) {
            throw new Error('Fee structure not found');
        }

        return feeStructure;
    }

    /**
     * Update fee structure
     */
    async updateFeeStructure(id: string, data: Partial<CreateFeeStructureInput>) {
        return await prisma.feeStructure.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete fee structure
     */
    async deleteFeeStructure(id: string) {
        await prisma.feeStructure.delete({
            where: { id },
        });
    }

    /**
     * Assign fee to student
     */
    async assignFee(data: AssignFeeInput) {
        const balance = data.totalAmount - (data.discountAmount || 0);

        return await prisma.feeAssignment.create({
            data: {
                studentId: data.studentId,
                classId: data.classId,
                feeStructureId: data.feeStructureId,
                totalAmount: data.totalAmount,
                discountAmount: data.discountAmount || 0,
                discountReason: data.discountReason,
                balance,
                dueDate: data.dueDate,
                academicYear: data.academicYear,
                term: data.term,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                feeStructure: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        amount: true,
                    },
                },
            },
        });
    }

    /**
     * Bulk assign fees to class
     */
    async bulkAssignFeesToClass(
        classId: string,
        feeStructureId: string,
        dueDate: Date,
        academicYear?: string,
        term?: string
    ) {
        const students = await prisma.user.findMany({
            where: { classId, role: 'STUDENT' },
            select: { id: true },
        });

        const feeStructure = await prisma.feeStructure.findUnique({
            where: { id: feeStructureId },
        });

        if (!feeStructure) {
            throw new Error('Fee structure not found');
        }

        const assignments = students.map(student => ({
            studentId: student.id,
            classId,
            feeStructureId,
            totalAmount: feeStructure.amount,
            balance: feeStructure.amount,
            dueDate,
            academicYear,
            term,
        }));

        await prisma.feeAssignment.createMany({
            data: assignments,
        });

        return { count: assignments.length };
    }

    /**
     * Get student fee assignments
     */
    async getStudentFeeAssignments(studentId: string, status?: PaymentStatus) {
        const where: any = { studentId };
        if (status) where.status = status;

        return await prisma.feeAssignment.findMany({
            where,
            include: {
                feeStructure: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        amount: true,
                    },
                },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
            orderBy: { dueDate: 'desc' },
        });
    }

    /**
     * Get class fee assignments
     */
    async getClassFeeAssignments(classId: string) {
        return await prisma.feeAssignment.findMany({
            where: { classId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                feeStructure: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                    },
                },
            },
            orderBy: { dueDate: 'desc' },
        });
    }

    /**
     * Record payment
     */
    async recordPayment(data: RecordPaymentInput) {
        const feeAssignment = await prisma.feeAssignment.findUnique({
            where: { id: data.feeAssignmentId },
        });

        if (!feeAssignment) {
            throw new Error('Fee assignment not found');
        }

        if (data.amount > feeAssignment.balance) {
            throw new Error('Payment amount exceeds balance');
        }

        // Generate receipt number
        const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                studentId: data.studentId,
                feeAssignmentId: data.feeAssignmentId,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate || new Date(),
                transactionRef: data.transactionRef,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                chequeNumber: data.chequeNumber,
                mobileNumber: data.mobileNumber,
                receiptNumber,
                notes: data.notes,
                processedBy: data.processedBy,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                feeAssignment: {
                    include: {
                        feeStructure: true,
                    },
                },
            },
        });

        // Update fee assignment
        const newPaidAmount = feeAssignment.paidAmount + data.amount;
        const newBalance = feeAssignment.balance - data.amount;
        let newStatus = feeAssignment.status;

        if (newBalance === 0) {
            newStatus = PaymentStatus.PAID;
        } else if (newPaidAmount > 0) {
            newStatus = PaymentStatus.PARTIAL;
        }

        await prisma.feeAssignment.update({
            where: { id: data.feeAssignmentId },
            data: {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            },
        });

        return payment;
    }

    /**
     * Get student payments
     */
    async getStudentPayments(studentId: string) {
        return await prisma.payment.findMany({
            where: { studentId },
            include: {
                feeAssignment: {
                    include: {
                        feeStructure: true,
                    },
                },
            },
            orderBy: { paymentDate: 'desc' },
        });
    }

    /**
     * Get payment by receipt number
     */
    async getPaymentByReceipt(receiptNumber: string) {
        const payment = await prisma.payment.findUnique({
            where: { receiptNumber },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                feeAssignment: {
                    include: {
                        feeStructure: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        return payment;
    }

    /**
     * Get financial summary for student
     */
    async getStudentFinancialSummary(studentId: string) {
        const assignments = await prisma.feeAssignment.findMany({
            where: { studentId },
        });

        const payments = await prisma.payment.findMany({
            where: { studentId },
        });

        const totalFees = assignments.reduce((sum, a) => sum + a.totalAmount, 0);
        const totalPaid = assignments.reduce((sum, a) => sum + a.paidAmount, 0);
        const totalBalance = assignments.reduce((sum, a) => sum + a.balance, 0);
        const totalDiscount = assignments.reduce((sum, a) => sum + a.discountAmount, 0);

        const pending = assignments.filter(a => a.status === PaymentStatus.PENDING).length;
        const partial = assignments.filter(a => a.status === PaymentStatus.PARTIAL).length;
        const paid = assignments.filter(a => a.status === PaymentStatus.PAID).length;
        const overdue = assignments.filter(
            a => a.status !== PaymentStatus.PAID && new Date(a.dueDate) < new Date()
        ).length;

        return {
            totalFees,
            totalPaid,
            totalBalance,
            totalDiscount,
            totalPayments: payments.length,
            pending,
            partial,
            paid,
            overdue,
            paymentHistory: payments.slice(0, 5),
        };
    }

    /**
     * Get school financial report
     */
    async getSchoolFinancialReport(schoolId: string, startDate?: Date, endDate?: Date) {
        const where: any = {
            student: { schoolId },
        };

        if (startDate && endDate) {
            where.paymentDate = {
                gte: startDate,
                lte: endDate,
            };
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                feeAssignment: {
                    include: {
                        feeStructure: true,
                    },
                },
            },
        });

        const assignments = await prisma.feeAssignment.findMany({
            where: {
                student: { schoolId },
            },
        });

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpected = assignments.reduce((sum, a) => sum + a.totalAmount, 0);
        const totalOutstanding = assignments.reduce((sum, a) => sum + a.balance, 0);

        const byCategory = new Map<string, number>();
        payments.forEach(p => {
            const category = p.feeAssignment.feeStructure.category;
            byCategory.set(category, (byCategory.get(category) || 0) + p.amount);
        });

        const byMethod = new Map<string, number>();
        payments.forEach(p => {
            byMethod.set(p.paymentMethod, (byMethod.get(p.paymentMethod) || 0) + p.amount);
        });

        return {
            totalRevenue,
            totalExpected,
            totalOutstanding,
            collectionRate: totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0,
            totalPayments: payments.length,
            revenueByCategory: Object.fromEntries(byCategory),
            revenueByMethod: Object.fromEntries(byMethod),
        };
    }

    /**
     * Get defaulters (students with overdue fees)
     */
    async getDefaulters(schoolId: string) {
        const assignments = await prisma.feeAssignment.findMany({
            where: {
                student: { schoolId },
                status: {
                    in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL],
                },
                dueDate: {
                    lt: new Date(),
                },
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                feeStructure: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });

        return assignments;
    }
}

export default new FinanceService();