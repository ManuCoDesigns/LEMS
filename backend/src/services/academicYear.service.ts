import { AcademicYear, Term } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateAcademicYearInput {
    name: string;
    startDate: Date;
    endDate: Date;
    schoolId: string;
}

export interface UpdateAcademicYearInput {
    name?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface CreateTermInput {
    name: string;
    termNumber: number;
    startDate: Date;
    endDate: Date;
    academicYearId: string;
}

export interface UpdateTermInput {
    name?: string;
    startDate?: Date;
    endDate?: Date;
}

class AcademicYearService {
    /**
     * Get all academic years for a school
     */
    async getAcademicYearsBySchool(schoolId: string) {
        const academicYears = await prisma.academicYear.findMany({
            where: { schoolId },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                terms: {
                    orderBy: { termNumber: 'asc' },
                },
                _count: {
                    select: { terms: true },
                },
            },
            orderBy: { startDate: 'desc' },
        });

        return academicYears;
    }

    /**
     * Get current academic year for a school
     */
    async getCurrentAcademicYear(schoolId: string) {
        const academicYear = await prisma.academicYear.findFirst({
            where: {
                schoolId,
                isCurrent: true,
            },
            include: {
                terms: {
                    orderBy: { termNumber: 'asc' },
                },
            },
        });

        return academicYear;
    }

    /**
     * Get academic year by ID
     */
    async getAcademicYearById(academicYearId: string) {
        const academicYear = await prisma.academicYear.findUnique({
            where: { id: academicYearId },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                terms: {
                    orderBy: { termNumber: 'asc' },
                },
            },
        });

        if (!academicYear) {
            throw new Error('Academic year not found');
        }

        return academicYear;
    }

    /**
     * Create new academic year
     */
    async createAcademicYear(data: CreateAcademicYearInput) {
        // Check if school exists
        const school = await prisma.school.findUnique({
            where: { id: data.schoolId },
        });

        if (!school) {
            throw new Error('School not found');
        }

        // Validate dates
        if (data.startDate >= data.endDate) {
            throw new Error('End date must be after start date');
        }

        // Create academic year
        const academicYear = await prisma.academicYear.create({
            data,
            include: {
                terms: true,
            },
        });

        return academicYear;
    }

    /**
     * Update academic year
     */
    async updateAcademicYear(academicYearId: string, data: UpdateAcademicYearInput) {
        // Check if academic year exists
        const existing = await prisma.academicYear.findUnique({
            where: { id: academicYearId },
        });

        if (!existing) {
            throw new Error('Academic year not found');
        }

        // Validate dates if both are provided
        if (data.startDate && data.endDate && data.startDate >= data.endDate) {
            throw new Error('End date must be after start date');
        }

        // Update academic year
        const academicYear = await prisma.academicYear.update({
            where: { id: academicYearId },
            data,
            include: {
                terms: true,
            },
        });

        return academicYear;
    }

    /**
     * Set current academic year
     */
    async setCurrentAcademicYear(academicYearId: string) {
        const academicYear = await prisma.academicYear.findUnique({
            where: { id: academicYearId },
        });

        if (!academicYear) {
            throw new Error('Academic year not found');
        }

        // Unset all other academic years in this school
        await prisma.academicYear.updateMany({
            where: {
                schoolId: academicYear.schoolId,
                isCurrent: true,
            },
            data: { isCurrent: false },
        });

        // Set this one as current
        const updated = await prisma.academicYear.update({
            where: { id: academicYearId },
            data: { isCurrent: true },
            include: {
                terms: true,
            },
        });

        return updated;
    }

    /**
     * Delete academic year
     */
    async deleteAcademicYear(academicYearId: string) {
        const academicYear = await prisma.academicYear.findUnique({
            where: { id: academicYearId },
        });

        if (!academicYear) {
            throw new Error('Academic year not found');
        }

        // Delete academic year (cascade will delete terms)
        await prisma.academicYear.delete({
            where: { id: academicYearId },
        });
    }

    // ==================== TERM MANAGEMENT ====================

    /**
     * Create term
     */
    async createTerm(data: CreateTermInput) {
        // Check if academic year exists
        const academicYear = await prisma.academicYear.findUnique({
            where: { id: data.academicYearId },
        });

        if (!academicYear) {
            throw new Error('Academic year not found');
        }

        // Validate dates are within academic year
        if (data.startDate < academicYear.startDate || data.endDate > academicYear.endDate) {
            throw new Error('Term dates must be within academic year dates');
        }

        // Validate dates
        if (data.startDate >= data.endDate) {
            throw new Error('End date must be after start date');
        }

        // Create term
        const term = await prisma.term.create({
            data,
        });

        return term;
    }

    /**
     * Update term
     */
    async updateTerm(termId: string, data: UpdateTermInput) {
        const term = await prisma.term.findUnique({
            where: { id: termId },
            include: { academicYear: true },
        });

        if (!term) {
            throw new Error('Term not found');
        }

        // Validate dates if provided
        if (data.startDate && data.endDate && data.startDate >= data.endDate) {
            throw new Error('End date must be after start date');
        }

        // Update term
        const updated = await prisma.term.update({
            where: { id: termId },
            data,
        });

        return updated;
    }

    /**
     * Set current term
     */
    async setCurrentTerm(termId: string) {
        const term = await prisma.term.findUnique({
            where: { id: termId },
        });

        if (!term) {
            throw new Error('Term not found');
        }

        // Unset all other terms in this academic year
        await prisma.term.updateMany({
            where: {
                academicYearId: term.academicYearId,
                isCurrent: true,
            },
            data: { isCurrent: false },
        });

        // Set this one as current
        const updated = await prisma.term.update({
            where: { id: termId },
            data: { isCurrent: true },
        });

        return updated;
    }

    /**
     * Delete term
     */
    async deleteTerm(termId: string) {
        const term = await prisma.term.findUnique({
            where: { id: termId },
        });

        if (!term) {
            throw new Error('Term not found');
        }

        await prisma.term.delete({
            where: { id: termId },
        });
    }

    /**
     * Get current term
     */
    async getCurrentTerm(schoolId: string) {
        const term = await prisma.term.findFirst({
            where: {
                academicYear: {
                    schoolId,
                    isCurrent: true,
                },
                isCurrent: true,
            },
            include: {
                academicYear: true,
            },
        });

        return term;
    }
}

export default new AcademicYearService();