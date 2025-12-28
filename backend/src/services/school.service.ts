import { School, SchoolType, SchoolStatus } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateSchoolInput {
    name: string;
    code: string;
    type: SchoolType;
    email: string;
    phone?: string;
    website?: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    logo?: string;
    motto?: string;
    mission?: string;
    vision?: string;
    foundedYear?: number;
    principalName?: string;
    currency?: string;
    timezone?: string;
    language?: string;
}

export interface UpdateSchoolInput {
    name?: string;
    type?: SchoolType;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    logo?: string;
    motto?: string;
    mission?: string;
    vision?: string;
    foundedYear?: number;
    principalName?: string;
    currency?: string;
    timezone?: string;
    language?: string;
}

export interface SchoolFilters {
    type?: SchoolType;
    status?: SchoolStatus;
    search?: string;
    country?: string;
    city?: string;
}

class SchoolService {
    /**
     * Get all schools with filters and pagination
     */
    async getAllSchools(filters: SchoolFilters = {}, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const where: any = {};

        // Apply filters
        if (filters.type) {
            where.type = filters.type;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.country) {
            where.country = { contains: filters.country, mode: 'insensitive' };
        }

        if (filters.city) {
            where.city = { contains: filters.city, mode: 'insensitive' };
        }

        // Search by name, code, or email
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Get schools and total count
        const [schools, total] = await Promise.all([
            prisma.school.findMany({
                where,
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            users: true,
                            departments: true,
                            academicYears: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.school.count({ where }),
        ]);

        return {
            schools,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get school by ID
     */
    async getSchoolById(schoolId: string) {
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                _count: {
                    select: {
                        users: true,
                        departments: true,
                        academicYears: true,
                    },
                },
            },
        });

        if (!school) {
            throw new Error('School not found');
        }

        return school;
    }

    /**
     * Get school by code
     */
    async getSchoolByCode(code: string) {
        const school = await prisma.school.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                _count: {
                    select: {
                        users: true,
                        departments: true,
                        academicYears: true,
                    },
                },
            },
        });

        if (!school) {
            throw new Error('School not found');
        }

        return school;
    }

    /**
     * Create new school
     */
    async createSchool(data: CreateSchoolInput) {
        // Check if school code already exists
        const existingSchool = await prisma.school.findUnique({
            where: { code: data.code.toUpperCase() },
        });

        if (existingSchool) {
            throw new Error('School with this code already exists');
        }

        // Create school
        const school = await prisma.school.create({
            data: {
                ...data,
                code: data.code.toUpperCase(),
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        departments: true,
                        academicYears: true,
                    },
                },
            },
        });

        return school;
    }

    /**
     * Update school
     */
    async updateSchool(schoolId: string, data: UpdateSchoolInput) {
        // Check if school exists
        const existingSchool = await prisma.school.findUnique({
            where: { id: schoolId },
        });

        if (!existingSchool) {
            throw new Error('School not found');
        }

        // Update school
        const school = await prisma.school.update({
            where: { id: schoolId },
            data,
            include: {
                _count: {
                    select: {
                        users: true,
                        departments: true,
                        academicYears: true,
                    },
                },
            },
        });

        return school;
    }

    /**
     * Update school status
     */
    async updateSchoolStatus(schoolId: string, status: SchoolStatus) {
        const school = await prisma.school.update({
            where: { id: schoolId },
            data: { status },
        });

        return school;
    }

    /**
     * Delete school
     */
    async deleteSchool(schoolId: string) {
        // Check if school exists
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });

        if (!school) {
            throw new Error('School not found');
        }

        // Check if school has users
        if (school._count.users > 0) {
            throw new Error('Cannot delete school with existing users. Please reassign or delete users first.');
        }

        // Delete school
        await prisma.school.delete({
            where: { id: schoolId },
        });
    }

    /**
     * Get school statistics
     */
    async getSchoolStats(schoolId?: string) {
        if (schoolId) {
            // Stats for specific school
            const [userCount, departmentCount, academicYearCount] = await Promise.all([
                prisma.user.count({ where: { schoolId } }),
                prisma.department.count({ where: { schoolId } }),
                prisma.academicYear.count({ where: { schoolId } }),
            ]);

            return {
                users: userCount,
                departments: departmentCount,
                academicYears: academicYearCount,
            };
        } else {
            // Global stats
            const [total, active, inactive, byType] = await Promise.all([
                prisma.school.count(),
                prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
                prisma.school.count({ where: { status: SchoolStatus.INACTIVE } }),
                prisma.school.groupBy({
                    by: ['type'],
                    _count: true,
                }),
            ]);

            return {
                total,
                byStatus: {
                    active,
                    inactive,
                },
                byType: byType.reduce((acc, item) => {
                    acc[item.type] = item._count;
                    return acc;
                }, {} as Record<string, number>),
            };
        }
    }

    /**
     * Get schools by user (for school admins)
     */
    async getSchoolsByUser(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { school: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // If super admin, return all schools
        if (user.role === 'SUPER_ADMIN') {
            return this.getAllSchools();
        }

        // If school admin or other roles, return their school only
        if (user.school) {
            return {
                schools: [user.school],
                pagination: {
                    page: 1,
                    limit: 1,
                    total: 1,
                    totalPages: 1,
                },
            };
        }

        return {
            schools: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
        };
    }
}

export default new SchoolService();