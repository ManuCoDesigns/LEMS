import { Request, Response } from 'express';
import assignmentService from '../services/assignment.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { AssignmentStatus } from '@prisma/client';

class AssignmentController {
    /**
     * Create new assignment
     * POST /api/v1/assignments
     */
    async createAssignment(req: Request, res: Response) {
        try {
            const {
                title,
                description,
                instructions,
                totalPoints,
                passingPoints,
                dueDate,
                allowLateSubmission,
                latePenalty,
                classId,
                subjectId,
                attachments,
            } = req.body;

            const createdById = req.user?.userId;

            if (!title || !dueDate || !classId || !subjectId) {
                return sendError(res, 400, 'Missing required fields', 'Title, due date, class ID, and subject ID are required');
            }

            if (!createdById) {
                return sendError(res, 401, 'Not authenticated');
            }

            const assignment = await assignmentService.createAssignment({
                title,
                description,
                instructions,
                totalPoints: totalPoints ? parseInt(totalPoints) : undefined,
                passingPoints: passingPoints ? parseInt(passingPoints) : undefined,
                dueDate: new Date(dueDate),
                allowLateSubmission,
                latePenalty: latePenalty ? parseFloat(latePenalty) : undefined,
                classId,
                subjectId,
                createdById,
                attachments,
            });

            return sendSuccess(res, 201, 'Assignment created successfully', { assignment });
        } catch (error) {
            console.error('Create assignment error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create assignment';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get assignments for a class
     * GET /api/v1/classes/:classId/assignments
     */
    async getClassAssignments(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const { subjectId } = req.query;

            const assignments = await assignmentService.getAssignmentsByClass(classId, subjectId as string);

            return sendSuccess(res, 200, 'Assignments retrieved successfully', { assignments });
        } catch (error) {
            console.error('Get assignments error:', error);
            return sendError(res, 500, 'Failed to retrieve assignments');
        }
    }

    /**
     * Get assignment by ID
     * GET /api/v1/assignments/:id
     */
    async getAssignmentById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const assignment = await assignmentService.getAssignmentById(id);

            return sendSuccess(res, 200, 'Assignment retrieved successfully', { assignment });
        } catch (error) {
            console.error('Get assignment error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve assignment';
            return sendError(res, 404, message);
        }
    }

    /**
     * Update assignment
     * PUT /api/v1/assignments/:id
     */
    async updateAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                instructions,
                totalPoints,
                passingPoints,
                dueDate,
                allowLateSubmission,
                latePenalty,
                attachments,
            } = req.body;

            const assignment = await assignmentService.updateAssignment(id, {
                title,
                description,
                instructions,
                totalPoints: totalPoints ? parseInt(totalPoints) : undefined,
                passingPoints: passingPoints ? parseInt(passingPoints) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                allowLateSubmission,
                latePenalty: latePenalty ? parseFloat(latePenalty) : undefined,
                attachments,
            });

            return sendSuccess(res, 200, 'Assignment updated successfully', { assignment });
        } catch (error) {
            console.error('Update assignment error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update assignment';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update assignment status
     * PATCH /api/v1/assignments/:id/status
     */
    async updateAssignmentStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !Object.values(AssignmentStatus).includes(status)) {
                return sendError(res, 400, 'Valid status is required');
            }

            const assignment = await assignmentService.updateAssignmentStatus(id, status);

            return sendSuccess(res, 200, 'Assignment status updated successfully', { assignment });
        } catch (error) {
            console.error('Update status error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update status';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete assignment
     * DELETE /api/v1/assignments/:id
     */
    async deleteAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await assignmentService.deleteAssignment(id);

            return sendSuccess(res, 200, 'Assignment deleted successfully');
        } catch (error) {
            console.error('Delete assignment error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete assignment';
            return sendError(res, 400, message);
        }
    }

    /**
     * Submit assignment
     * POST /api/v1/assignments/:id/submit
     */
    async submitAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { content, attachments } = req.body;
            const studentId = req.user?.userId;

            if (!studentId) {
                return sendError(res, 401, 'Not authenticated');
            }

            const submission = await assignmentService.submitAssignment({
                assignmentId: id,
                studentId,
                content,
                attachments,
            });

            return sendSuccess(res, 201, 'Assignment submitted successfully', { submission });
        } catch (error) {
            console.error('Submit assignment error:', error);
            const message = error instanceof Error ? error.message : 'Failed to submit assignment';
            return sendError(res, 400, message);
        }
    }

    /**
     * Grade submission
     * POST /api/v1/submissions/:id/grade
     */
    async gradeSubmission(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { points, feedback } = req.body;
            const gradedById = req.user?.userId;

            if (!points && points !== 0) {
                return sendError(res, 400, 'Points are required');
            }

            if (!gradedById) {
                return sendError(res, 401, 'Not authenticated');
            }

            const submission = await assignmentService.gradeSubmission({
                submissionId: id,
                points: parseInt(points),
                feedback,
                gradedById,
            });

            return sendSuccess(res, 200, 'Submission graded successfully', { submission });
        } catch (error) {
            console.error('Grade submission error:', error);
            const message = error instanceof Error ? error.message : 'Failed to grade submission';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get student submissions
     * GET /api/v1/students/:studentId/submissions
     */
    async getStudentSubmissions(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const { classId } = req.query;

            const submissions = await assignmentService.getStudentSubmissions(studentId, classId as string);

            return sendSuccess(res, 200, 'Submissions retrieved successfully', { submissions });
        } catch (error) {
            console.error('Get submissions error:', error);
            return sendError(res, 500, 'Failed to retrieve submissions');
        }
    }

    /**
     * Get assignment statistics
     * GET /api/v1/assignments/:id/stats
     */
    async getAssignmentStats(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const stats = await assignmentService.getAssignmentStats(id);

            return sendSuccess(res, 200, 'Statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get stats error:', error);
            return sendError(res, 500, 'Failed to retrieve statistics');
        }
    }

    /**
     * Get class assignment statistics
     * GET /api/v1/classes/:classId/assignments/stats
     */
    async getClassAssignmentStats(req: Request, res: Response) {
        try {
            const { classId } = req.params;

            const stats = await assignmentService.getClassAssignmentStats(classId);

            return sendSuccess(res, 200, 'Statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get class stats error:', error);
            return sendError(res, 500, 'Failed to retrieve statistics');
        }
    }
}

export default new AssignmentController();