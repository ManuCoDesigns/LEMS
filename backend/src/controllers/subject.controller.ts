import { Request, Response } from 'express';
import subjectService from '../services/subject.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { SubjectCategory } from '@prisma/client';

class SubjectController {
    /**
     * Get all subjects for a school
     * GET /api/v1/schools/:schoolId/subjects
     */
    async getSubjectsBySchool(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const { departmentId } = req.query;

            const subjects = await subjectService.getSubjectsBySchool(schoolId, departmentId as string);

            return sendSuccess(res, 200, 'Subjects retrieved successfully', { subjects });
        } catch (error) {
            console.error('Get subjects error:', error);
            return sendError(res, 500, 'Failed to retrieve subjects');
        }
    }

    /**
     * Get subject by ID
     * GET /api/v1/subjects/:id
     */
    async getSubjectById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const subject = await subjectService.getSubjectById(id);

            return sendSuccess(res, 200, 'Subject retrieved successfully', { subject });
        } catch (error) {
            console.error('Get subject error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve subject';
            return sendError(res, 404, message);
        }
    }

    /**
     * Create new subject
     * POST /api/v1/schools/:schoolId/subjects
     */
    async createSubject(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const { name, code, description, category, credits, departmentId } = req.body;

            if (!name || !code) {
                return sendError(res, 400, 'Missing required fields', 'Name and code are required');
            }

            const subject = await subjectService.createSubject({
                name,
                code,
                description,
                category: category as SubjectCategory,
                credits: credits ? parseInt(credits) : undefined,
                schoolId,
                departmentId,
            });

            return sendSuccess(res, 201, 'Subject created successfully', { subject });
        } catch (error) {
            console.error('Create subject error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create subject';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update subject
     * PUT /api/v1/subjects/:id
     */
    async updateSubject(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, category, credits, departmentId } = req.body;

            const subject = await subjectService.updateSubject(id, {
                name,
                description,
                category: category as SubjectCategory,
                credits: credits ? parseInt(credits) : undefined,
                departmentId,
            });

            return sendSuccess(res, 200, 'Subject updated successfully', { subject });
        } catch (error) {
            console.error('Update subject error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update subject';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete subject
     * DELETE /api/v1/subjects/:id
     */
    async deleteSubject(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await subjectService.deleteSubject(id);

            return sendSuccess(res, 200, 'Subject deleted successfully');
        } catch (error) {
            console.error('Delete subject error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete subject';
            return sendError(res, 400, message);
        }
    }

    /**
     * Assign teacher to subject
     * POST /api/v1/subjects/:id/teachers
     */
    async assignTeacher(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { teacherId, isPrimary } = req.body;

            if (!teacherId) {
                return sendError(res, 400, 'Teacher ID is required');
            }

            const assignment = await subjectService.assignTeacherToSubject(id, teacherId, isPrimary || false);

            return sendSuccess(res, 201, 'Teacher assigned successfully', { assignment });
        } catch (error) {
            console.error('Assign teacher error:', error);
            const message = error instanceof Error ? error.message : 'Failed to assign teacher';
            return sendError(res, 400, message);
        }
    }

    /**
     * Remove teacher from subject
     * DELETE /api/v1/subjects/:id/teachers/:teacherId
     */
    async removeTeacher(req: Request, res: Response) {
        try {
            const { id, teacherId } = req.params;

            await subjectService.removeTeacherFromSubject(id, teacherId);

            return sendSuccess(res, 200, 'Teacher removed successfully');
        } catch (error) {
            console.error('Remove teacher error:', error);
            const message = error instanceof Error ? error.message : 'Failed to remove teacher';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get subjects by teacher
     * GET /api/v1/teachers/:teacherId/subjects
     */
    async getSubjectsByTeacher(req: Request, res: Response) {
        try {
            const { teacherId } = req.params;

            const subjects = await subjectService.getSubjectsByTeacher(teacherId);

            return sendSuccess(res, 200, 'Subjects retrieved successfully', { subjects });
        } catch (error) {
            console.error('Get teacher subjects error:', error);
            return sendError(res, 500, 'Failed to retrieve subjects');
        }
    }

    /**
     * Get subject statistics
     * GET /api/v1/subjects/stats
     */
    async getSubjectStats(req: Request, res: Response) {
        try {
            const { schoolId } = req.query;

            const stats = await subjectService.getSubjectStats(schoolId as string);

            return sendSuccess(res, 200, 'Statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get subject stats error:', error);
            return sendError(res, 500, 'Failed to retrieve statistics');
        }
    }
}

export default new SubjectController();