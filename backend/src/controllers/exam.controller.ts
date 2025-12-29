import { Request, Response } from 'express';
import examService from '../services/exam.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { ExamStatus, ExamType, QuestionType } from '@prisma/client';

class ExamController {
    /**
     * Create new exam
     * POST /api/v1/exams
     */
    async createExam(req: Request, res: Response) {
        try {
            const {
                title,
                description,
                instructions,
                examType,
                totalMarks,
                passingMarks,
                duration,
                startTime,
                endTime,
                shuffleQuestions,
                showResults,
                allowReview,
                classId,
                subjectId,
            } = req.body;

            const createdById = req.user?.userId;

            if (!title || !examType || !duration || !startTime || !endTime || !classId || !subjectId) {
                return sendError(res, 400, 'Missing required fields');
            }

            if (!createdById) {
                return sendError(res, 401, 'Not authenticated');
            }

            const exam = await examService.createExam({
                title,
                description,
                instructions,
                examType,
                totalMarks: totalMarks ? parseInt(totalMarks) : undefined,
                passingMarks: passingMarks ? parseInt(passingMarks) : undefined,
                duration: parseInt(duration),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                shuffleQuestions,
                showResults,
                allowReview,
                classId,
                subjectId,
                createdById,
            });

            return sendSuccess(res, 201, 'Exam created successfully', { exam });
        } catch (error) {
            console.error('Create exam error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create exam';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get exam by ID
     * GET /api/v1/exams/:id
     */
    async getExamById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const exam = await examService.getExamById(id);

            return sendSuccess(res, 200, 'Exam retrieved successfully', { exam });
        } catch (error) {
            console.error('Get exam error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve exam';
            return sendError(res, 404, message);
        }
    }

    /**
     * Get exams for a class
     * GET /api/v1/classes/:classId/exams
     */
    async getClassExams(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const { subjectId } = req.query;

            const exams = await examService.getClassExams(classId, subjectId as string);

            return sendSuccess(res, 200, 'Exams retrieved successfully', { exams });
        } catch (error) {
            console.error('Get exams error:', error);
            return sendError(res, 500, 'Failed to retrieve exams');
        }
    }

    /**
     * Update exam
     * PUT /api/v1/exams/:id
     */
    async updateExam(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                instructions,
                examType,
                totalMarks,
                passingMarks,
                duration,
                startTime,
                endTime,
                shuffleQuestions,
                showResults,
                allowReview,
            } = req.body;

            const exam = await examService.updateExam(id, {
                title,
                description,
                instructions,
                examType,
                totalMarks: totalMarks ? parseInt(totalMarks) : undefined,
                passingMarks: passingMarks ? parseInt(passingMarks) : undefined,
                duration: duration ? parseInt(duration) : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                shuffleQuestions,
                showResults,
                allowReview,
            });

            return sendSuccess(res, 200, 'Exam updated successfully', { exam });
        } catch (error) {
            console.error('Update exam error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update exam';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update exam status
     * PATCH /api/v1/exams/:id/status
     */
    async updateExamStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !Object.values(ExamStatus).includes(status)) {
                return sendError(res, 400, 'Valid status is required');
            }

            const exam = await examService.updateExamStatus(id, status);

            return sendSuccess(res, 200, 'Exam status updated successfully', { exam });
        } catch (error) {
            console.error('Update status error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update status';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete exam
     * DELETE /api/v1/exams/:id
     */
    async deleteExam(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await examService.deleteExam(id);

            return sendSuccess(res, 200, 'Exam deleted successfully');
        } catch (error) {
            console.error('Delete exam error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete exam';
            return sendError(res, 400, message);
        }
    }

    /**
     * Add question to exam
     * POST /api/v1/exams/:id/questions
     */
    async addQuestion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { questionType, questionText, marks, order, options, correctAnswer, sampleAnswer } = req.body;

            if (!questionType || !questionText || !marks || order === undefined) {
                return sendError(res, 400, 'Missing required fields');
            }

            const question = await examService.addQuestion({
                examId: id,
                questionType,
                questionText,
                marks: parseInt(marks),
                order: parseInt(order),
                options,
                correctAnswer,
                sampleAnswer,
            });

            return sendSuccess(res, 201, 'Question added successfully', { question });
        } catch (error) {
            console.error('Add question error:', error);
            const message = error instanceof Error ? error.message : 'Failed to add question';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get exam questions
     * GET /api/v1/exams/:id/questions
     */
    async getExamQuestions(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const questions = await examService.getExamQuestions(id);

            return sendSuccess(res, 200, 'Questions retrieved successfully', { questions });
        } catch (error) {
            console.error('Get questions error:', error);
            return sendError(res, 500, 'Failed to retrieve questions');
        }
    }

    /**
     * Update question
     * PUT /api/v1/questions/:id
     */
    async updateQuestion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { questionType, questionText, marks, order, options, correctAnswer, sampleAnswer } = req.body;

            const question = await examService.updateQuestion(id, {
                questionType,
                questionText,
                marks: marks ? parseInt(marks) : undefined,
                order: order ? parseInt(order) : undefined,
                options,
                correctAnswer,
                sampleAnswer,
            });

            return sendSuccess(res, 200, 'Question updated successfully', { question });
        } catch (error) {
            console.error('Update question error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update question';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete question
     * DELETE /api/v1/questions/:id
     */
    async deleteQuestion(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await examService.deleteQuestion(id);

            return sendSuccess(res, 200, 'Question deleted successfully');
        } catch (error) {
            console.error('Delete question error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete question';
            return sendError(res, 400, message);
        }
    }

    /**
     * Submit exam
     * POST /api/v1/exams/:id/submit
     */
    async submitExam(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { answers, duration } = req.body;
            const studentId = req.user?.userId;

            if (!studentId) {
                return sendError(res, 401, 'Not authenticated');
            }

            if (!answers || !Array.isArray(answers)) {
                return sendError(res, 400, 'Answers are required');
            }

            const result = await examService.submitExam({
                examId: id,
                studentId,
                answers,
                duration: duration ? parseInt(duration) : 0,
            });

            return sendSuccess(res, 201, 'Exam submitted successfully', { result });
        } catch (error) {
            console.error('Submit exam error:', error);
            const message = error instanceof Error ? error.message : 'Failed to submit exam';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get student exam result
     * GET /api/v1/exams/:id/result
     */
    async getStudentResult(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const studentId = req.user?.userId;

            if (!studentId) {
                return sendError(res, 401, 'Not authenticated');
            }

            const result = await examService.getStudentResult(id, studentId);

            if (!result) {
                return sendError(res, 404, 'Result not found');
            }

            return sendSuccess(res, 200, 'Result retrieved successfully', { result });
        } catch (error) {
            console.error('Get result error:', error);
            return sendError(res, 500, 'Failed to retrieve result');
        }
    }

    /**
     * Get all results for an exam
     * GET /api/v1/exams/:id/results
     */
    async getExamResults(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const results = await examService.getExamResults(id);

            return sendSuccess(res, 200, 'Results retrieved successfully', { results });
        } catch (error) {
            console.error('Get results error:', error);
            return sendError(res, 500, 'Failed to retrieve results');
        }
    }

    /**
     * Grade subjective answer
     * POST /api/v1/answers/:id/grade
     */
    async gradeAnswer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { marksObtained } = req.body;

            if (marksObtained === undefined || marksObtained === null) {
                return sendError(res, 400, 'Marks obtained is required');
            }

            const answer = await examService.gradeAnswer(id, parseInt(marksObtained));

            return sendSuccess(res, 200, 'Answer graded successfully', { answer });
        } catch (error) {
            console.error('Grade answer error:', error);
            const message = error instanceof Error ? error.message : 'Failed to grade answer';
            return sendError(res, 400, message);
        }
    }

    /**
     * Get exam statistics
     * GET /api/v1/exams/:id/stats
     */
    async getExamStats(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const stats = await examService.getExamStats(id);

            return sendSuccess(res, 200, 'Statistics retrieved successfully', stats);
        } catch (error) {
            console.error('Get stats error:', error);
            return sendError(res, 500, 'Failed to retrieve statistics');
        }
    }
}

export default new ExamController();