import { Request, Response } from 'express';
import academicYearService from '../services/academicYear.service';
import { sendSuccess, sendError } from '../utils/response.util';

class AcademicYearController {
    /**
     * Get all academic years for a school
     * GET /api/v1/schools/:schoolId/academic-years
     */
    async getAcademicYearsBySchool(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;

            const academicYears = await academicYearService.getAcademicYearsBySchool(schoolId);

            return sendSuccess(res, 200, 'Academic years retrieved successfully', { academicYears });
        } catch (error) {
            console.error('Get academic years error:', error);
            return sendError(res, 500, 'Failed to retrieve academic years');
        }
    }

    /**
     * Get current academic year for a school
     * GET /api/v1/schools/:schoolId/academic-years/current
     */
    async getCurrentAcademicYear(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;

            const academicYear = await academicYearService.getCurrentAcademicYear(schoolId);

            if (!academicYear) {
                return sendError(res, 404, 'No current academic year set');
            }

            return sendSuccess(res, 200, 'Current academic year retrieved successfully', { academicYear });
        } catch (error) {
            console.error('Get current academic year error:', error);
            return sendError(res, 500, 'Failed to retrieve current academic year');
        }
    }

    /**
     * Get academic year by ID
     * GET /api/v1/academic-years/:id
     */
    async getAcademicYearById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const academicYear = await academicYearService.getAcademicYearById(id);

            return sendSuccess(res, 200, 'Academic year retrieved successfully', { academicYear });
        } catch (error) {
            console.error('Get academic year error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve academic year';
            return sendError(res, 404, message);
        }
    }

    /**
     * Create new academic year
     * POST /api/v1/schools/:schoolId/academic-years
     */
    async createAcademicYear(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const { name, startDate, endDate } = req.body;

            // Validate required fields
            if (!name || !startDate || !endDate) {
                return sendError(res, 400, 'Missing required fields', 'Name, start date, and end date are required');
            }

            const academicYear = await academicYearService.createAcademicYear({
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                schoolId,
            });

            return sendSuccess(res, 201, 'Academic year created successfully', { academicYear });
        } catch (error) {
            console.error('Create academic year error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create academic year';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update academic year
     * PUT /api/v1/academic-years/:id
     */
    async updateAcademicYear(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, startDate, endDate } = req.body;

            const academicYear = await academicYearService.updateAcademicYear(id, {
                name,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });

            return sendSuccess(res, 200, 'Academic year updated successfully', { academicYear });
        } catch (error) {
            console.error('Update academic year error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update academic year';
            return sendError(res, 400, message);
        }
    }

    /**
     * Set current academic year
     * PATCH /api/v1/academic-years/:id/set-current
     */
    async setCurrentAcademicYear(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const academicYear = await academicYearService.setCurrentAcademicYear(id);

            return sendSuccess(res, 200, 'Current academic year set successfully', { academicYear });
        } catch (error) {
            console.error('Set current academic year error:', error);
            const message = error instanceof Error ? error.message : 'Failed to set current academic year';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete academic year
     * DELETE /api/v1/academic-years/:id
     */
    async deleteAcademicYear(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await academicYearService.deleteAcademicYear(id);

            return sendSuccess(res, 200, 'Academic year deleted successfully');
        } catch (error) {
            console.error('Delete academic year error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete academic year';
            return sendError(res, 400, message);
        }
    }

    // ==================== TERM ENDPOINTS ====================

    /**
     * Create term
     * POST /api/v1/academic-years/:academicYearId/terms
     */
    async createTerm(req: Request, res: Response) {
        try {
            const { academicYearId } = req.params;
            const { name, termNumber, startDate, endDate } = req.body;

            // Validate required fields
            if (!name || !termNumber || !startDate || !endDate) {
                return sendError(res, 400, 'Missing required fields', 'Name, term number, start date, and end date are required');
            }

            const term = await academicYearService.createTerm({
                name,
                termNumber: parseInt(termNumber),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                academicYearId,
            });

            return sendSuccess(res, 201, 'Term created successfully', { term });
        } catch (error) {
            console.error('Create term error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create term';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update term
     * PUT /api/v1/terms/:id
     */
    async updateTerm(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, startDate, endDate } = req.body;

            const term = await academicYearService.updateTerm(id, {
                name,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });

            return sendSuccess(res, 200, 'Term updated successfully', { term });
        } catch (error) {
            console.error('Update term error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update term';
            return sendError(res, 400, message);
        }
    }

    /**
     * Set current term
     * PATCH /api/v1/terms/:id/set-current
     */
    async setCurrentTerm(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const term = await academicYearService.setCurrentTerm(id);

            return sendSuccess(res, 200, 'Current term set successfully', { term });
        } catch (error) {
            console.error('Set current term error:', error);
            const message = error instanceof Error ? error.message : 'Failed to set current term';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete term
     * DELETE /api/v1/terms/:id
     */
    async deleteTerm(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await academicYearService.deleteTerm(id);

            return sendSuccess(res, 200, 'Term deleted successfully');
        } catch (error) {
            console.error('Delete term error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete term';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get current term
     * GET /api/v1/schools/:schoolId/current-term
     */
    async getCurrentTerm(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;

            const term = await academicYearService.getCurrentTerm(schoolId);

            if (!term) {
                return sendError(res, 404, 'No current term set');
            }

            return sendSuccess(res, 200, 'Current term retrieved successfully', { term });
        } catch (error) {
            console.error('Get current term error:', error);
            return sendError(res, 500, 'Failed to retrieve current term');
        }
    }
}

export default new AcademicYearController();