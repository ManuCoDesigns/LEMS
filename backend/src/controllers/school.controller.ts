import { Request, Response } from 'express';
import schoolService from '../services/school.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { SchoolType, SchoolStatus } from '@prisma/client';

class SchoolController {
    /**
     * Get all schools
     * GET /api/v1/schools
     */
    async getAllSchools(req: Request, res: Response) {
        try {
            const { type, status, search, country, city, page = '1', limit = '10' } = req.query;

            const filters = {
                type: type as SchoolType,
                status: status as SchoolStatus,
                search: search as string,
                country: country as string,
                city: city as string,
            };

            const result = await schoolService.getAllSchools(
                filters,
                parseInt(page as string),
                parseInt(limit as string)
            );

            return sendSuccess(res, 200, 'Schools retrieved successfully', result);
        } catch (error) {
            console.error('Get all schools error:', error);
            return sendError(res, 500, 'Failed to retrieve schools');
        }
    }

    /**
     * Get school by ID
     * GET /api/v1/schools/:id
     */
    async getSchoolById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const school = await schoolService.getSchoolById(id);

            return sendSuccess(res, 200, 'School retrieved successfully', { school });
        } catch (error) {
            console.error('Get school error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve school';
            return sendError(res, 404, message);
        }
    }

    /**
     * Get school by code
     * GET /api/v1/schools/code/:code
     */
    async getSchoolByCode(req: Request, res: Response) {
        try {
            const { code } = req.params;

            const school = await schoolService.getSchoolByCode(code);

            return sendSuccess(res, 200, 'School retrieved successfully', { school });
        } catch (error) {
            console.error('Get school by code error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve school';
            return sendError(res, 404, message);
        }
    }

    /**
     * Create new school
     * POST /api/v1/schools
     */
    async createSchool(req: Request, res: Response) {
        try {
            const {
                name,
                code,
                type,
                email,
                phone,
                website,
                address,
                city,
                state,
                country,
                postalCode,
                logo,
                motto,
                mission,
                vision,
                foundedYear,
                principalName,
                currency,
                timezone,
                language,
            } = req.body;

            // Validate required fields
            if (!name || !code || !type || !email || !address || !city || !country) {
                return sendError(
                    res,
                    400,
                    'Missing required fields',
                    'Name, code, type, email, address, city, and country are required'
                );
            }

            const school = await schoolService.createSchool({
                name,
                code,
                type,
                email,
                phone,
                website,
                address,
                city,
                state,
                country,
                postalCode,
                logo,
                motto,
                mission,
                vision,
                foundedYear: foundedYear ? parseInt(foundedYear) : undefined,
                principalName,
                currency,
                timezone,
                language,
            });

            return sendSuccess(res, 201, 'School created successfully', { school });
        } catch (error) {
            console.error('Create school error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create school';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update school
     * PUT /api/v1/schools/:id
     */
    async updateSchool(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                name,
                type,
                email,
                phone,
                website,
                address,
                city,
                state,
                country,
                postalCode,
                logo,
                motto,
                mission,
                vision,
                foundedYear,
                principalName,
                currency,
                timezone,
                language,
            } = req.body;

            const school = await schoolService.updateSchool(id, {
                name,
                type,
                email,
                phone,
                website,
                address,
                city,
                state,
                country,
                postalCode,
                logo,
                motto,
                mission,
                vision,
                foundedYear: foundedYear ? parseInt(foundedYear) : undefined,
                principalName,
                currency,
                timezone,
                language,
            });

            return sendSuccess(res, 200, 'School updated successfully', { school });
        } catch (error) {
            console.error('Update school error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update school';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update school status
     * PATCH /api/v1/schools/:id/status
     */
    async updateSchoolStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !Object.values(SchoolStatus).includes(status)) {
                return sendError(res, 400, 'Valid status is required');
            }

            const school = await schoolService.updateSchoolStatus(id, status);

            return sendSuccess(res, 200, 'School status updated successfully', { school });
        } catch (error) {
            console.error('Update school status error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update status';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete school
     * DELETE /api/v1/schools/:id
     */
    async deleteSchool(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await schoolService.deleteSchool(id);

            return sendSuccess(res, 200, 'School deleted successfully');
        } catch (error) {
            console.error('Delete school error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete school';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get school statistics
     * GET /api/v1/schools/stats
     * GET /api/v1/schools/:id/stats
     */
    async getSchoolStats(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const stats = await schoolService.getSchoolStats(id);

            return sendSuccess(res, 200, 'Statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get school stats error:', error);
            return sendError(res, 500, 'Failed to retrieve statistics');
        }
    }

    /**
     * Get schools by current user
     * GET /api/v1/schools/my-schools
     */
    async getMySchools(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return sendError(res, 401, 'Not authenticated');
            }

            const result = await schoolService.getSchoolsByUser(userId);

            return sendSuccess(res, 200, 'Schools retrieved successfully', result);
        } catch (error) {
            console.error('Get my schools error:', error);
            return sendError(res, 500, 'Failed to retrieve schools');
        }
    }
}

export default new SchoolController();