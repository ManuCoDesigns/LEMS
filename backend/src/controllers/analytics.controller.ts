import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response.util';

class AnalyticsController {
    /**
     * Get student performance analytics
     * GET /api/v1/students/:studentId/analytics
     */
    async getStudentPerformance(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const { academicYearId } = req.query;

            const analytics = await analyticsService.getStudentPerformance(studentId, academicYearId as string);

            return sendSuccess(res, 200, 'Student analytics retrieved successfully', analytics);
        } catch (error) {
            console.error('Get student analytics error:', error);
            return sendError(res, 500, 'Failed to retrieve analytics');
        }
    }

    /**
     * Get class performance analytics
     * GET /api/v1/classes/:classId/analytics
     */
    async getClassPerformance(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const { academicYearId, termType } = req.query;

            if (!academicYearId) {
                return sendError(res, 400, 'Academic year ID is required');
            }

            const analytics = await analyticsService.getClassPerformance(
                classId,
                academicYearId as string,
                termType as string
            );

            return sendSuccess(res, 200, 'Class analytics retrieved successfully', analytics);
        } catch (error) {
            console.error('Get class analytics error:', error);
            return sendError(res, 500, 'Failed to retrieve analytics');
        }
    }

    /**
     * Get subject performance analytics
     * GET /api/v1/subjects/:subjectId/analytics
     */
    async getSubjectPerformance(req: Request, res: Response) {
        try {
            const { subjectId } = req.params;
            const { academicYearId } = req.query;

            if (!academicYearId) {
                return sendError(res, 400, 'Academic year ID is required');
            }

            const analytics = await analyticsService.getSubjectPerformance(subjectId, academicYearId as string);

            return sendSuccess(res, 200, 'Subject analytics retrieved successfully', analytics);
        } catch (error) {
            console.error('Get subject analytics error:', error);
            return sendError(res, 500, 'Failed to retrieve analytics');
        }
    }

    /**
     * Get attendance trends
     * GET /api/v1/classes/:classId/analytics/attendance
     */
    async getAttendanceTrends(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return sendError(res, 400, 'Start date and end date are required');
            }

            const analytics = await analyticsService.getAttendanceTrends(
                classId,
                new Date(startDate as string),
                new Date(endDate as string)
            );

            return sendSuccess(res, 200, 'Attendance trends retrieved successfully', analytics);
        } catch (error) {
            console.error('Get attendance trends error:', error);
            return sendError(res, 500, 'Failed to retrieve attendance trends');
        }
    }

    /**
     * Get assignment completion analytics
     * GET /api/v1/classes/:classId/analytics/assignments
     */
    async getAssignmentCompletion(req: Request, res: Response) {
        try {
            const { classId } = req.params;

            const analytics = await analyticsService.getAssignmentCompletion(classId);

            return sendSuccess(res, 200, 'Assignment analytics retrieved successfully', { assignments: analytics });
        } catch (error) {
            console.error('Get assignment analytics error:', error);
            return sendError(res, 500, 'Failed to retrieve assignment analytics');
        }
    }

    /**
     * Get exam results analytics
     * GET /api/v1/exams/:examId/analytics
     */
    async getExamResults(req: Request, res: Response) {
        try {
            const { examId } = req.params;

            const analytics = await analyticsService.getExamResults(examId);

            return sendSuccess(res, 200, 'Exam analytics retrieved successfully', analytics);
        } catch (error) {
            console.error('Get exam analytics error:', error);
            return sendError(res, 500, 'Failed to retrieve exam analytics');
        }
    }
}

export default new AnalyticsController();