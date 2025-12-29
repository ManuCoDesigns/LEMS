import { Request, Response } from 'express';
import gradeService from '../services/grade.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { GradingScale, TermType } from '@prisma/client';

class GradeController {
    /**
     * Create grading scheme
     * POST /api/v1/grading-schemes
     */
    async createGradingScheme(req: Request, res: Response) {
        try {
            const { name, description, scale, isDefault, schoolId, boundaries } = req.body;

            if (!name || !scale || !schoolId || !boundaries || !Array.isArray(boundaries)) {
                return sendError(res, 400, 'Missing required fields');
            }

            const scheme = await gradeService.createGradingScheme({
                name,
                description,
                scale,
                isDefault,
                schoolId,
                boundaries,
            });

            return sendSuccess(res, 201, 'Grading scheme created successfully', { scheme });
        } catch (error) {
            console.error('Create grading scheme error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create grading scheme';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get school grading schemes
     * GET /api/v1/schools/:schoolId/grading-schemes
     */
    async getSchoolGradingSchemes(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;

            const schemes = await gradeService.getSchoolGradingSchemes(schoolId);

            return sendSuccess(res, 200, 'Grading schemes retrieved successfully', { schemes });
        } catch (error) {
            console.error('Get grading schemes error:', error);
            return sendError(res, 500, 'Failed to retrieve grading schemes');
        }
    }

    /**
     * Get grading scheme by ID
     * GET /api/v1/grading-schemes/:id
     */
    async getGradingSchemeById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const scheme = await gradeService.getGradingSchemeById(id);

            return sendSuccess(res, 200, 'Grading scheme retrieved successfully', { scheme });
        } catch (error) {
            console.error('Get grading scheme error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve grading scheme';
            return sendError(res, 404, message);
        }
    }

    /**
     * Update grading scheme
     * PUT /api/v1/grading-schemes/:id
     */
    async updateGradingScheme(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, scale, isDefault } = req.body;

            const scheme = await gradeService.updateGradingScheme(id, {
                name,
                description,
                scale,
                isDefault,
            });

            return sendSuccess(res, 200, 'Grading scheme updated successfully', { scheme });
        } catch (error) {
            console.error('Update grading scheme error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update grading scheme';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete grading scheme
     * DELETE /api/v1/grading-schemes/:id
     */
    async deleteGradingScheme(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await gradeService.deleteGradingScheme(id);

            return sendSuccess(res, 200, 'Grading scheme deleted successfully');
        } catch (error) {
            console.error('Delete grading scheme error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete grading scheme';
            return sendError(res, 400, message);
        }
    }

    /**
     * Calculate grade for a student in a subject
     * POST /api/v1/grades/calculate
     */
    async calculateGrade(req: Request, res: Response) {
        try {
            const { studentId, classId, subjectId, academicYearId, termId, termType, schemeId } = req.body;

            if (!studentId || !classId || !subjectId || !academicYearId || !termType) {
                return sendError(res, 400, 'Missing required fields');
            }

            const grade = await gradeService.calculateGrade({
                studentId,
                classId,
                subjectId,
                academicYearId,
                termId,
                termType,
                schemeId,
            });

            return sendSuccess(res, 200, 'Grade calculated successfully', { grade });
        } catch (error) {
            console.error('Calculate grade error:', error);
            const message = error instanceof Error ? error.message : 'Failed to calculate grade';
            return sendError(res, 400, message);
        }
    }

    /**
     * Calculate all grades for a student
     * POST /api/v1/students/:studentId/grades/calculate-all
     */
    async calculateAllGrades(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const { classId, academicYearId, termType, termId } = req.body;

            if (!classId || !academicYearId || !termType) {
                return sendError(res, 400, 'Missing required fields');
            }

            const grades = await gradeService.calculateAllGradesForStudent(
                studentId,
                classId,
                academicYearId,
                termType,
                termId
            );

            return sendSuccess(res, 200, 'All grades calculated successfully', { grades });
        } catch (error) {
            console.error('Calculate all grades error:', error);
            const message = error instanceof Error ? error.message : 'Failed to calculate grades';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get student grades
     * GET /api/v1/students/:studentId/grades
     */
    async getStudentGrades(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const { academicYearId, termType } = req.query;

            const grades = await gradeService.getStudentGrades(
                studentId,
                academicYearId as string,
                termType as TermType
            );

            return sendSuccess(res, 200, 'Grades retrieved successfully', { grades });
        } catch (error) {
            console.error('Get student grades error:', error);
            return sendError(res, 500, 'Failed to retrieve grades');
        }
    }

    /**
     * Get class grades
     * GET /api/v1/classes/:classId/grades
     */
    async getClassGrades(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const { academicYearId, termType, subjectId } = req.query;

            if (!academicYearId || !termType) {
                return sendError(res, 400, 'Academic year and term type are required');
            }

            const grades = await gradeService.getClassGrades(
                classId,
                academicYearId as string,
                termType as TermType,
                subjectId as string
            );

            return sendSuccess(res, 200, 'Class grades retrieved successfully', { grades });
        } catch (error) {
            console.error('Get class grades error:', error);
            return sendError(res, 500, 'Failed to retrieve class grades');
        }
    }

    /**
     * Generate report card
     * POST /api/v1/report-cards/generate
     */
    async generateReportCard(req: Request, res: Response) {
        try {
            const { studentId, classId, academicYearId, termId, termType, classTeacherComment, principalComment } =
                req.body;

            if (!studentId || !classId || !academicYearId || !termType) {
                return sendError(res, 400, 'Missing required fields');
            }

            const result = await gradeService.generateReportCard({
                studentId,
                classId,
                academicYearId,
                termId,
                termType,
                classTeacherComment,
                principalComment,
            });

            return sendSuccess(res, 201, 'Report card generated successfully', result);
        } catch (error) {
            console.error('Generate report card error:', error);
            const message = error instanceof Error ? error.message : 'Failed to generate report card';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get report card
     * GET /api/v1/report-cards/:id
     */
    async getReportCard(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const result = await gradeService.getReportCard(id);

            return sendSuccess(res, 200, 'Report card retrieved successfully', result);
        } catch (error) {
            console.error('Get report card error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve report card';
            return sendError(res, 404, message);
        }
    }

    /**
     * Publish report card
     * PATCH /api/v1/report-cards/:id/publish
     */
    async publishReportCard(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const generatedBy = req.user?.userId;

            if (!generatedBy) {
                return sendError(res, 401, 'Not authenticated');
            }

            const reportCard = await gradeService.publishReportCard(id, generatedBy);

            return sendSuccess(res, 200, 'Report card published successfully', { reportCard });
        } catch (error) {
            console.error('Publish report card error:', error);
            const message = error instanceof Error ? error.message : 'Failed to publish report card';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get student transcript
     * GET /api/v1/students/:studentId/transcript
     */
    async getStudentTranscript(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            const result = await gradeService.getStudentTranscript(studentId);

            return sendSuccess(res, 200, 'Transcript retrieved successfully', result);
        } catch (error) {
            console.error('Get transcript error:', error);
            return sendError(res, 500, 'Failed to retrieve transcript');
        }
    }

    /**
     * Update transcript
     * POST /api/v1/students/:studentId/transcript/update
     */
    async updateTranscript(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            const transcript = await gradeService.updateTranscript(studentId);

            return sendSuccess(res, 200, 'Transcript updated successfully', { transcript });
        } catch (error) {
            console.error('Update transcript error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update transcript';
            return sendError(res, 400, message);
        }
    }
}

export default new GradeController();