import { Department } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateDepartmentInput {
    name: string;
    code: string;
    description?: string;
    schoolId: string;
    hodName?: string;
    hodEmail?: string;
    hodPhone?: string;
}

export interface UpdateDepartmentInput {
    name?: string;
    description?: string;
    hodName?: string;
    hodEmail?: string;
    hodPhone?: string;
}

class DepartmentService {
    /**
     * Get all departments for a school
     */
    async getDepartmentsBySchool(schoolId: string) {
        const departments = await prisma.department.findMany({
            where: { schoolId },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return departments;
    }

    /**
     * Get department by ID
     */
    async getDepartmentById(departmentId: string) {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        if (!department) {
            throw new Error('Department not found');
        }

        return department;
    }

    /**
     * Create new department
     */
    async createDepartment(data: CreateDepartmentInput) {
        // Check if school exists
        const school = await prisma.school.findUnique({
            where: { id: data.schoolId },
        });

        if (!school) {
            throw new Error('School not found');
        }

        // Check if department code already exists in this school
        const existingDepartment = await prisma.department.findFirst({
            where: {
                schoolId: data.schoolId,
                code: data.code.toUpperCase(),
            },
        });

        if (existingDepartment) {
            throw new Error('Department with this code already exists in this school');
        }

        // Create department
        const department = await prisma.department.create({
            data: {
                ...data,
                code: data.code.toUpperCase(),
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        return department;
    }

    /**
     * Update department
     */
    async updateDepartment(departmentId: string, data: UpdateDepartmentInput) {
        // Check if department exists
        const existingDepartment = await prisma.department.findUnique({
            where: { id: departmentId },
        });

        if (!existingDepartment) {
            throw new Error('Department not found');
        }

        // Update department
        const department = await prisma.department.update({
            where: { id: departmentId },
            data,
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        return department;
    }

    /**
     * Delete department
     */
    async deleteDepartment(departmentId: string) {
        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
        });

        if (!department) {
            throw new Error('Department not found');
        }

        // Delete department
        await prisma.department.delete({
            where: { id: departmentId },
        });
    }

    /**
     * Get department statistics
     */
    async getDepartmentStats(schoolId?: string) {
        if (schoolId) {
            const count = await prisma.department.count({
                where: { schoolId },
            });

            return { total: count };
        } else {
            const total = await prisma.department.count();
            return { total };
        }
    }
}

export default new DepartmentService();